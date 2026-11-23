from app.rag.rag_service import get_chat_model, retrieve_relevant_chunks
import re

def remove_duplicate_requirements(lines: list[str]) -> list[str]:
    """Tekrarlanan ve aynı anlamı taşıyan gereklilikleri temizler."""

    unique_lines = []
    seen = set()

    for line in lines:
        cleaned_line = re.sub(
            r"\[(?:Sayfa|Kaynak).*?\]",
            "",
            line,
        ).strip()

        cleaned_line = re.sub(
            r"^\s*\d+[\.\)]\s*",
            "",
            cleaned_line,
        )

        normalized = cleaned_line.casefold()
        normalized = re.sub(r"[^\w\s]", " ", normalized)
        normalized = " ".join(normalized.split())

        if "çift kolçak" in normalized and "hareketli" in normalized:
            key = "surucu koltugu cift hareketli kolcak"
        elif "bel desteği" in normalized or "bel destegi" in normalized:
            key = "surucu koltugu bel destegi"
        else:
            key = normalized

        if key and key not in seen:
            seen.add(key)
            unique_lines.append(line)

    return unique_lines


def extract_key_requirements(documents) -> list[str]:
    """Kaynak metinlerden açıkça belirtilen temel yükümlülükleri çıkarır."""

    requirements = []

    for document in documents:
        text = re.sub(r"\s+", " ", document.page_content)
        page = document.metadata.get("page_number")

        if (
            "sürücü koltuğunun" in text.casefold()
            or "sürücü koltuğu" in text.casefold()
        ):
            technical_patterns = [
                r"Sürücü koltuğunun sırt tarafı yatırılabilir olacaktır\.",
                r"Sürücü koltuğunun baş kısmı olacak ve aşağı-yukarı hareketli olacaktır\.",
                r"Sürücü koltuğu kendi ekseni etrafında dönebilir tip olacaktır\.",
                r"Sürücü koltuğunda çift kolçak bulunacaktır.*?tip olacaktır\.",
                r"Sürücü koltuğunun bel desteği.*?bulunacaktır\.",
                r"Sürücü koltuğunun oturma mesafesini ayarlama.*?olacaktır\.",
                r"Sürücü koltuğu ileri geri ayarlanabilir olacaktır\.",
                r"Sürücü koltuğunun eğim ayar butonu bulunacaktır\.",
                r"Koltuk yüzeylerine uygulanacak kumaş alev almaz malzeme olacaktır\..*?HL-3 yanmazlık seviyesini karşılayacaktır\.",
            ]

            for pattern in technical_patterns:
                match = re.search(pattern, text, re.IGNORECASE)

                if match:
                    requirements.append(
                        f"{match.group(0).strip()} [Sayfa {page}]"
                    )

        match = re.search(
            r"Teslim yeri\s*:\s*(.*?)(?=\s*10\.4\.|\s*NAKLİYE|\s*NAKLIYE|$)",
            text,
            re.IGNORECASE,
        )

        if match:
            requirements.append(
                f"Teslim yeri: {match.group(1).strip()} [Sayfa {page}]"
            )

        match = re.search(
            r"(Nakliye.*?Yüklenicinin sorumluluğundadır\.)",
            text,
            re.IGNORECASE,
        )

        if match:
            requirements.append(
                f"{match.group(1).strip()} [Sayfa {page}]"
            )

        match = re.search(
            r"(Yüklenici tarafından teslim edilecek malların.*?garanti süresi olacaktır\.)",
            text,
            re.IGNORECASE,
        )

        if match:
            requirements.append(
                f"{match.group(1).strip()} [Sayfa {page}]"
            )

    return requirements


def execute_extract_requirements(
    question: str,
    user_id: str,
    document_id: str,
    retrieved_chunks=None,
) -> dict:
    """Dokümandaki teknik ve idari gereklilikleri çıkarır."""

    if not question or not question.strip():
        raise ValueError("Gereklilik çıkarma sorusu boş olamaz.")

    if not user_id or not document_id:
        raise ValueError("user_id ve document_id zorunludur.")

    if retrieved_chunks is None:
        general_documents = retrieve_relevant_chunks(
            question=question,
            user_id=user_id,
            document_id=document_id,
        )

        technical_documents = retrieve_relevant_chunks(
            question="Dokümandaki tüm teknik özellikleri, ölçüleri, standartları ve ürün gerekliliklerini çıkar.",
            user_id=user_id,
            document_id=document_id,
        )

        documents = general_documents + technical_documents

        unique_documents = {}

        for document in documents:
            key = (
                document.metadata.get("page_number"),
                document.metadata.get("chunk_index"),
            )

            unique_documents[key] = document

        documents = list(unique_documents.values())

    else:
        documents = retrieved_chunks

    if not documents:
        return {
            "requirements": "İlgili dokümanda gereklilik bulunamadı.",
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

    prompt = f"""
Sen bir ihale dokümanı analiz asistanısın.

Görev:
Verilen doküman parçalarındaki önemli teknik ve idari gereklilikleri çıkar.

Kurallar:
- Yalnızca verilen metinlerde açıkça bulunan bilgileri kullan.
- En fazla 15 gereklilik yaz.
- Her gereklilik tek, kısa ama açıklayıcı bir cümle olsun.
- Her maddeyi "Yüklenici ... zorundadır" veya "Ürün ... olmalıdır" gibi tamamlanmış bir yükümlülük cümlesi olarak yaz.
- Kaynakta sayı, süre, adres veya sorumlu taraf bilgisi varsa bu bilgiyi mutlaka cevaba dahil et.
- "Teslim yeri belirleme", "Garanti süresi belirleme" gibi genel başlıklar yazma.
- Kaynakta somut bilgi yoksa o konuda gereklilik uydurma.
- Varsa süre, miktar, adres ve sorumlu taraf gibi somut bilgileri mutlaka belirt.
- Aynı bilgiyi tekrar etme.
- Tahmin yürütme ve bilgi uydurma.
- Açıklama veya giriş paragrafı yazma.
- Her maddeyi numaralandır.
- Gereklilik bulamazsan "Gereklilik bulunamadı." yaz.

Doküman parçaları:
{context}

Cevap:
"""

    response = get_chat_model(num_predict=250).invoke(prompt)

    requirement_lines = [
        line.strip()
        for line in response.content.splitlines()
        if re.match(r"^\s*\d+[\.\)]\s+", line)
    ]

    key_requirements = extract_key_requirements(documents)

    filtered_model_lines = []

    for line in requirement_lines:
        content = re.sub(
            r"^\s*\d+[\.\)]\s*",
            "",
            line,
        ).strip()

        normalized = content.casefold()

        obligation_markers = [
            "olmalıdır",
            "olacaktır",
            "olur.",
            "bulunmalıdır",
            "bulunacaktır",
            "edilmelidir",
            "edilecektir",
            "yapılmalıdır",
            "yapılacaktır",
            "sağlanmalıdır",
            "sağlanacaktır",
            "karşılamalıdır",
            "karşılayacaktır",
            "zorundadır",
            "gerekmektedir",
        ]

        if not any(
            marker in normalized
            for marker in obligation_markers
        ):
            continue

        if "garanti" in normalized or "nakliye" in normalized:
            continue

        filtered_model_lines.append(content)

    combined_requirements = key_requirements + filtered_model_lines

    combined_requirements = remove_duplicate_requirements(
        combined_requirements
    )

    if combined_requirements:
        formatted_lines = [
            f"{index}. {line}"
            for index, line in enumerate(
                combined_requirements[:15],
                start=1,
            )
        ]

        requirements = (
            "Gereklilikler:\n" + "\n".join(formatted_lines)
        )

    else:
        requirements = "Gereklilik bulunamadı."

    return {
        "requirements": requirements,
        "sources": sources,
    }
