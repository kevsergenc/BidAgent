ALLOWED_ACTIVITIES = {
    "search_documents",
    "extract_requirements",
    "check_documents",
    "detect_risks",
    "compare_documents",
    "generate_answer",
    "generate_report",
    "save_output",
}


def plan_activities(question: str) -> list[str]:
    """
    Kullanıcı isteğini anahtar kelimelere göre analiz eder
    ve gerekli aktiviteleri belirler.
    """

    if not question or not question.strip():
        raise ValueError("Kullanıcı sorusu boş olamaz.")

    normalized_question = question.casefold()
    activities = []

    rules = {
        "search_documents": [
            "dokümanda ara",
            "doküman içinde ara",
            "belgede ara",
            "belge içinde ara",
            "şu ifadeyi bul",
            "dokümanları ara",
            "kelimesini bul",
            "ifadesini bul",
            "metinde bul",
            "geçiyor mu",
            "nerede geçiyor",
            "hangi sayfada",
            "hangi bölümde",
            "şartını bul",
        ],
        "extract_requirements": [
            "gereklilik",
            "teknik şart",
            "şartları çıkar",
            "koşulları çıkar",
            "yükümlülükleri çıkar",
            "istenen belgeleri ve şartları",
            "sorumluluklarını listele",
            "özellikleri çıkar",
            "madde madde çıkar",
            "gereklilikleri listele",
            "yükümlülükleri listele",
        ],
        "check_documents": [
            "eksik belge",
            "belgelerimi kontrol",
            "evraklarımı kontrol",
            "belge kontrolü",
            "belgeler yeterli mi",
            "hangi belgeler gerekli",
        ],
        "detect_risks": [
            "risk",
            "sakınca",
            "tehlike",
            "olası sorun",
            "cezai şart",
        ],
        "compare_documents": [
            "karşılaştır",
            "kıyasla",
            "farklarını bul",
            "farklılıklarını bul",
            "iki doküman arasındaki fark",
        ],
        "generate_report": [
            "rapor oluştur",
            "rapor hazırla",
            "rapor üret",
            "analiz raporu",
        ],
        "save_output": [
            "kaydet",
            "dosya olarak indir",
            "dışa aktar",
            "çıktıyı kaydet",
        ],
        "generate_answer": [
            "açıkla",
            "açıklama yap",
            "özetle",
            "cevapla",
            "yanıtla",
        ],
    }

    for activity, keywords in rules.items():
        if any(keyword in normalized_question for keyword in keywords):
            activities.append(activity)

    question_indicators = [
        "kaç",
        "ne kadar",
        "nedir",
        "nasıl",
        "hangi",
        "kim",
        "ne zaman",
        "nerede",
        "mı",
        "mi",
        "mu",
        "mü",
    ]

    padded_question = f" {normalized_question} "

    has_question = (
        "?" in normalized_question
        or any(
            f" {indicator} " in padded_question
            for indicator in question_indicators
        )
    )

    if has_question and "generate_answer" not in activities:
        activities.append("generate_answer")

    if not activities:
        activities.append("generate_answer")

    return [
        activity
        for activity in dict.fromkeys(activities)
        if activity in ALLOWED_ACTIVITIES
    ]



