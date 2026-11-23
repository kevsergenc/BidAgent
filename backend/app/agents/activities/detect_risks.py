from app.rag.rag_service import get_chat_model, retrieve_risk_chunks


def identify_risk_candidates(documents: list) -> list:
    """Kaynak metinlerdeki olası yüklenici risklerini belirler."""

    risk_candidates = []

    risk_patterns = [
        {
            "keywords": ["nakliye", "zarar", "ziyan"],
            "risk_type": "Nakliye ve taşıma sorumluluğu",
            "description": (
                "Nakliye giderleri ve taşıma sırasında ortaya çıkabilecek "
                "zarar/ziyanlar yüklenicinin sorumluluğundadır. Bu durum, "
                "yüklenici açısından ek maliyet ve taşıma hasarı sorumluluğu "
                "doğurabilir."
            ),
        },
        {
            "keywords": ["numune", "onayına sunmak"],
            "risk_type": "Numune onayı yükümlülüğü",
            "description": (
                "Teslimattan önce numune sunulması ve işletme onayının "
                "alınması gerekmektedir. Numune onay sürecinin teslimat "
                "planlamasında dikkate alınması gerekir."
            ),
        },
        {
            "keywords": ["garanti", "imalat", "montaj"],
            "risk_type": "Garanti yükümlülüğü",
            "description": (
                "Kabul sonrasında imalat, montaj ve malzeme hatalarına "
                "karşı iki yıl garanti yükümlülüğü bulunmaktadır. "
                "Bu süre içinde garanti kapsamındaki kusurlar yüklenici "
                "açısından sorumluluk doğurabilir."
            ),
        },
    ]

    detected_risk_types = set()

    for document in documents:
        content = document.page_content.lower()
        metadata = document.metadata

        for pattern in risk_patterns:
            risk_type = pattern["risk_type"]

            if risk_type in detected_risk_types:
                continue

            if all(
                keyword in content
                for keyword in pattern["keywords"]
            ):
                risk_candidates.append({
                    "risk_type": risk_type,
                    "description": pattern["description"],
                    "page_number": metadata.get("page_number"),
                    "chunk_index": metadata.get("chunk_index"),
                    "evidence": document.page_content,
                })

                detected_risk_types.add(risk_type)

    return risk_candidates


def execute_detect_risks(
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks=None,
) -> dict:
    """İhale dokümanındaki somut yüklenici risklerini tespit eder."""

    if not question or not question.strip():
        raise ValueError("Risk analizi sorusu boş olamaz.")

    if not user_id or not document_id:
        raise ValueError("user_id ve document_id zorunludur.")

    if retrieved_chunks is None:
        documents = retrieve_risk_chunks(
        question=question,
        user_id=user_id,
        document_id=document_id,
    )
    else:
        documents = retrieved_chunks

    if not documents:
        return {
            "risks": "Risk analizi için ilgili doküman içeriği bulunamadı.",
            "sources": [],
        }

    context_parts = []
    sources = []

    for index, document in enumerate(documents, start=1):
        metadata = document.metadata
        page_number = metadata.get("page_number")

        context_parts.append(
            f"[Kaynak {index} - Sayfa {page_number}]\n"
            f"{document.page_content}"
        )

        sources.append({
            "page_number": page_number,
            "chunk_index": metadata.get("chunk_index"),
            "source_file": metadata.get("source_file"),
        })

    context = "\n\n".join(context_parts)
    risk_candidates = identify_risk_candidates(documents)
    candidate_parts = []

    for index, candidate in enumerate(risk_candidates, start=1):
        candidate_parts.append(
            f"""
            Aday {index}
            Risk türü: {candidate['risk_type']}
            Sayfa: {candidate['page_number']}
            Kaynak metin:
            {candidate['evidence']}
            """
                    )

    candidate_context = "\n\n".join(candidate_parts)

    prompt = f"""
Sen ihale dokümanlarını inceleyen bir risk analiz asistanısın.

Görevin yalnızca aşağıda verilen risk adaylarını değerlendirmektir.

Kurallar:
- Her adayı ayrı değerlendir.
- Bir yükümlülüğü kesin zarar veya sözleşme ihlali olarak gösterme.
- Yalnızca kaynak metinde açıkça bulunan bilgileri kullan.
- Kaynakta bulunmayan ceza, maliyet veya yaptırım uydurma.
- Aynı riski tekrarlama.
- En fazla 3 risk belirt.
- Dokümanda açıkça belirtilen yükümlülükleri, yüklenici açısından olası riskleri değerlendirmek için kullan.
- Nakliye giderleri, garanti süresi ve numune onayı gibi yükümlülükleri otomatik olarak eleme.
- Yükümlülüğün maliyet, sorumluluk, teslimat planlaması veya kalite açısından doğurabileceği etkiyi açıkla.
- Kaynakta açıkça belirtilmeyen ceza veya yaptırımları kesin bilgi gibi sunma.

Her risk için şu formatı kullan:

Risk:
Açıklama:
Kaynak sayfa:

Somut risk bulunamazsa yalnızca:
"Verilen metinlerde somut bir yüklenici riski tespit edilemedi."

Kullanıcı isteği:
{question}

RİSK ADAYLARI:
{candidate_context}

RİSK ANALİZİ:
"""


    if risk_candidates:
        risk_parts = []

        for index, candidate in enumerate(
            risk_candidates[:3], start=1
        ):
            risk_parts.append(
                f"{index}. Risk: {candidate['risk_type']}\n"
                f"Açıklama: {candidate['description']}\n"
                f"Kaynak sayfa: {candidate['page_number']}"
            )

        risk_text = "\n\n".join(risk_parts)

    else:
        risk_text = (
            "Verilen metinlerde somut bir yüklenici riski "
            "tespit edilemedi."
        )


    source_details = []

    for index, document in enumerate(documents, start=1):
        metadata = document.metadata

        source_details.append({
            "source_number": index,
            "page_number": metadata.get("page_number"),
            "chunk_index": metadata.get("chunk_index"),
            "source_file": metadata.get("source_file"),
            "evidence": document.page_content[:500],
        })

    return {
    "risks": risk_text,
    "sources": sources,
    "source_details": source_details,
}

