import logging
import time

from langchain_ollama import ChatOllama

from app.core.config import get_settings
from app.rag.vectorstore.vector_store import search_document_chunks

logger = logging.getLogger(__name__)


def get_chat_model(num_predict: int | None = None) -> ChatOllama:
    """Create the configured Ollama chat model."""

    settings = get_settings()

    return ChatOllama(
        model=settings.chat_model,
        base_url=settings.ollama_base_url,
        temperature=settings.chat_temperature,
        num_predict=num_predict,
    )



def build_search_queries(question: str) -> list[str]:
    """Create question-specific search queries."""

    normalized_question = question.casefold()

    if any(
        keyword in normalized_question
        for keyword in [
            "teslim süresi",
            "işin süresi",
            "kaç gün",
            "kaç takvim günü",
            "işe başlama",
        ]
    ):
        return [
            question,
            "İşin süresi işe başlama tarihinden itibaren kaç takvim günüdür?",
            "Teslimatın tamamlanması için verilen süre nedir?",
        ]

    if any(
        keyword in normalized_question
        for keyword in [
            "garanti",
            "garanti süresi",
            "garanti şartları",
        ]
    ):
        return [
            question,
            "Teslim edilen malların garanti süresi kaç yıldır?",
            "İmalat montaj ve malzeme hatalarına karşı garanti koşulları",
        ]

    if any(
        keyword in normalized_question
        for keyword in [
            "nakliye",
            "taşıma gider",
            "nakliye gider",
            "zarar",
            "ziyan",
        ]
    ):
        return [
            question,
            "Nakliye giderleri ve zarar ziyan kimin sorumluluğundadır?",
            "Yüklenicinin nakliye ile ilgili mali yükümlülükleri",
        ]

    return [
        question,
        f"{question} yükümlülükler sorumluluklar şartlar",
        f"{question} süreler koşullar belgeler ve gerekli işlemler",
    ]

def retrieve_relevant_chunks(
    question: str,
    user_id: str,
    document_id: str,
    top_k: int = 5,
):
    """Retrieve relevant chunks using RRF."""

    search_queries = build_search_queries(question)

    rrf_scores = {}
    unique_documents = {}
    rrf_constant = 60

    for query in search_queries:
        documents = search_document_chunks(
            query=query,
            user_id=user_id,
            document_id=document_id,
            k=top_k,
        )

        for rank, document in enumerate(documents, start=1):
            metadata = document.metadata

            chunk_key = (
                metadata.get("page_number"),
                metadata.get("chunk_index"),
                metadata.get("source_file"),
            )

            rrf_scores[chunk_key] = (
                rrf_scores.get(chunk_key, 0)
                + 1 / (rrf_constant + rank)
            )

            if chunk_key not in unique_documents:
                unique_documents[chunk_key] = document

    ranked_keys = sorted(
        rrf_scores,
        key=lambda key: rrf_scores[key],
        reverse=True,
    )

    return [
        unique_documents[key]
        for key in ranked_keys[:top_k]
    ]

def retrieve_risk_chunks(
    question: str,
    user_id: str,
    document_id: str,
    top_k: int = 5,
):
    """Retrieve chunks related to contractor risks."""

    risk_queries = [
        question,
        "Yüklenicinin nakliye taşıma giderleri ve zarar ziyan sorumluluğu",
        "Yüklenicinin gecikme cezası yaptırımları ve sözleşmeye aykırılık",
        "Teslim süresi muayene kabul ve ürün reddi koşulları",
        "Numune teslimi ürün onayı ve garanti yükümlülükleri",
    ]

    rrf_scores = {}
    unique_documents = {}
    rrf_constant = 60

    for query in risk_queries:
        documents = search_document_chunks(
            query=query,
            user_id=user_id,
            document_id=document_id,
            k=top_k,
        )

        for rank, document in enumerate(documents, start=1):
            metadata = document.metadata

            chunk_key = (
                metadata.get("page_number"),
                metadata.get("chunk_index"),
                metadata.get("source_file"),
            )

            rrf_scores[chunk_key] = (
                rrf_scores.get(chunk_key, 0)
                + 1 / (rrf_constant + rank)
            )

            if chunk_key not in unique_documents:
                unique_documents[chunk_key] = document

    ranked_keys = sorted(
        rrf_scores,
        key=lambda key: rrf_scores[key],
        reverse=True,
    )

    return [
        unique_documents[key]
        for key in ranked_keys[:top_k]
    ]


def build_rag_prompt(
    question: str,
    context: str,
) -> str:
    """Build a concise, grounded RAG prompt."""

    normalized_question = question.casefold()

    responsibility_keywords = [
        "kim sorumlu",
        "kimin sorumluluğunda",
        "kim karşılar",
        "kim öder",
        "kime ait",
        "sorumluluk",
        "sorumludur",
    ]

    is_responsibility_question = any(
        keyword in normalized_question
        for keyword in responsibility_keywords
    )

    if is_responsibility_question:
        return f"""
Sen BidAgent isimli ihale dokümanı analiz asistanısın.

GÖREV:
Kaynak metinlerde sorulan konuyla doğrudan ilgili sorumluluk hükmünü bul.

KURALLAR:
- Yalnızca verilen kaynak metinlerini kullan.
- "Yüklenicinin sorumluluğundadır" ifadesi Yükleniciyi belirtir.
- "İdarenin sorumluluğundadır" ifadesi İdareyi belirtir.
- Sadece soruyla ilgili sorumluluk hükmünü kullan.
- Teslim yeri, adres veya kurum adını sorumlu taraf olarak yorumlama.
- Birbirinden farklı hükümleri cevaba ekleme.
- Kaynakta açık bir sorumlu taraf bulunmuyorsa bunu belirt.
- Cevabı tek ve kısa bir cümleyle yaz.
- Cümlenin sonuna ilgili kaynak sayfasını ekle.
- Kaynakta olmayan bilgi üretme.

SORU:
{question}

KAYNAKLAR:
{context}

CEVAP:
"""

    return f"""
Sen BidAgent isimli ihale dokümanı analiz asistanısın.

Görevin, kullanıcının sorusunu yalnızca verilen kaynak metinlerine
dayanarak Türkçe cevaplamaktır.

GENEL KURALLAR:
- Öncelikle sorunun doğrudan cevabını bul.
- Yalnızca soruyla ilgili bilgileri kullan.
- Kaynakta bulunmayan bilgi ekleme veya tahmin yürütme.
- Farklı konulara ait hükümleri birbirine karıştırma.
- Bir bilgi açıkça belirtilmişse gereksiz yorum yapma.
- Süre, tarih, miktar ve sorumlu taraf gibi bilgileri aynen koru.
- Cevabı kısa, açık ve doğrudan yaz.
- İlgili kaynak sayfasını belirt.
- Cevap kaynaklarda bulunmuyorsa bunu açıkça söyle.
- Kaynak metnini veya soruyu gereksiz yere tekrar etme.

SORU:
{question}

KAYNAKLAR:
{context}

CEVAP:
"""



def ask_document(
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks=None,
) -> dict:
    """Answer a question using shared or newly retrieved chunks."""

    if not question or not question.strip():
        raise ValueError("Soru bos olamaz.")

    if not user_id or not document_id:
        raise ValueError(
            "user_id ve document_id zorunludur."
        )

    settings = get_settings()

    retrieval_start = time.perf_counter()

    if retrieved_chunks is None:
        documents = retrieve_relevant_chunks(
            question=question,
            user_id=user_id,
            document_id=document_id,
            top_k=settings.rag_top_k,
        )
    else:
        documents = retrieved_chunks[:settings.rag_top_k]

    retrieval_duration = time.perf_counter() - retrieval_start

    logger.info(
        "RAG RETRIEVAL: %.2f saniye | %d chunk bulundu",
        retrieval_duration,
        len(documents),
    )

    if not documents:
        return {
            "answer": (
                "Bu dokuman icinde soruyla ilgili "
                "bir kaynak bulunamadi."
            ),
            "sources": [],
        }

    context_parts = []
    sources = []

    for index, document in enumerate(documents, start=1):
        metadata = document.metadata

        page_number = metadata.get("page_number")
        chunk_index = metadata.get("chunk_index")

        context_parts.append(
            f"[Kaynak {index} - Sayfa {page_number}]\n"
            f"{document.page_content}"
        )

        sources.append(
            {
                "page_number": page_number,
                "chunk_index": chunk_index,
                "source_file": metadata.get("source_file"),
            }
        )

    context = "\n\n".join(context_parts)

    prompt = build_rag_prompt(
        question=question,
        context=context,
    )

    llm = get_chat_model(num_predict=250)

    generation_start = time.perf_counter()
    response = llm.invoke(prompt)
    generation_duration = time.perf_counter() - generation_start

    logger.info(
        "LLM GENERATION: %.2f saniye",
        generation_duration,
    )

    return {
        "answer": response.content,
        "sources": sources,
    }
