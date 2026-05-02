<div align="center">

<br>

# 🖐 AttendX
### *من ملف البصمة إلى تقرير احترافي — في ثوانٍ*

<br>

![Version](https://img.shields.io/badge/version-1.0.0-f0a500?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-3fb950?style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML-CSS-JS-58a6ff?style=for-the-badge&logo=html5)
![No Server](https://img.shields.io/badge/No_Server_Required-offline-a371f7?style=for-the-badge)

<br>

> *"كل يوم عمل له قصة — AttendX يرويها بدقة."*

<br>

</div>

---

## 💡 الفكرة

كل شهر، مئات الموظفين يسجّلون حضورهم وانصرافهم عبر جهاز البصمة.  
لكن الملف الخام `log.dat` الذي يخرج من الجهاز لا يعني شيئًا لأحد —  
**مجرد أرقام وتواريخ متناثرة.**

**AttendX** وُلد ليحوّل هذه الفوضى إلى تقرير منظم، ملوّن، وقابل للتحليل فورًا،  
دون الحاجة لخادم، دون رفع بيانات لأي مكان، ودون تعقيد.

---

## ✨ المميزات

| الميزة | التفاصيل |
|--------|----------|
| 📂 **رفع الملف** | سحب وإفلات أو اختيار مباشر — يُقرأ محلياً فقط على جهازك |
| 👥 **متعدد الموظفين** | يعالج كل الأكواد دفعة واحدة، ويعرض تقرير مستقل لكل موظف |
| ⏰ **الورديات** | أكثر من وردية لأكواد مختلفة، مع حساب التأخير والانصراف المبكر والإضافي تلقائيًا |
| 🏖 **الإجازات** | 10 أنواع مختلفة بألوان مميزة — اعتيادية، عارضة، زواج، حج، مرضية، وأكثر |
| 📊 **المعاينة** | جداول تفاعلية لكل موظف مع إجماليات فورية قبل التصدير |
| 📥 **تصدير Excel** | تقرير منسق باحترافية مع ألوان وإجماليات وفوتر المطور |
| 🔴 **الغياب** | أي يوم بدون بصمة يُسجَّل تلقائيًا كـ "غياب" |
| 🔒 **الخصوصية** | البيانات لا تغادر جهازك — لا خوادم، لا إنترنت مطلوب |

---

## 🗂️ هيكل المشروع

```
AttendX/
├── index.html        ← هيكل الصفحة
├── style.css         ← التصميم والأنيميشن
├── app.js            ← المنطق الكامل والمعالجة والتصدير
├── README.md         ← أنت هنا 👋
└── img/
    └── your-photo    ← صورة المطور في الهيدر
```

---

## 🚀 كيفية الاستخدام

```
1. ارفع ملف log.dat من فلاشة جهاز البصمة
2. حدد نطاق التاريخ (من / إلى)
3. أضف بيانات الوردية (وقت البداية والنهاية)
4. أضف الإجازات إن وُجدت
5. اضغط "معاينة" لترى النتائج فورًا
6. اضغط "تصدير Excel" للحصول على التقرير الكامل
```

---

## 📄 صيغ الملف المدعومة

يدعم AttendX معظم صيغ ملفات البصمة الشائعة:

```
# مفصول بمسافات
000123  2024-01-15  08:03:22

# مفصول بفاصلة
000123,2024/01/15,08:03:22

# مفصول بـ Tab
000123	15/01/2024	08:03:22

# مفصول بـ Pipe
000123|2024-01-15|08:03:22
```

---

## 📊 ما يحتويه تقرير Excel

**📋 شيت التقرير الكامل:**
- جدول مستقل لكل موظف في نفس الصفحة
- أول بصمة (حضور) — آخر بصمة (انصراف)
- التأخير — الانصراف المبكر — الإضافي اليومي — إجمالي الإضافي
- الحالة: حاضر 🟢 / غياب 🔴 / نوع الإجازة 🔵
- صف إجماليات لكل موظف + صف إجمالي كلي

**📊 شيت ملخص الموظفين:**
- أيام الحضور والغياب والإجازات
- عدد مرات التأخير والانصراف المبكر
- إجمالي ساعات العمل الفعلية

---

## 🌐 النشر على GitHub Pages

```bash
# 1. ارفع الملفات على مستودع GitHub
# 2. اذهب لـ Settings → Pages
# 3. اختر: Source → main branch
# 4. الموقع سيكون جاهزاً على:

https://USERNAME.github.io/REPO-NAME/
```

---

## 💻 الاستخدام المحلي

```bash
# لا يحتاج أي تثبيت أو خادم
# فقط افتح الملف مباشرة في المتصفح:

open index.html
```

---

<div align="center">

<br>

## 👨‍💻 المطور

**Mohamed Samy**

*"أبني أدوات تحل مشاكل حقيقية."*

<br>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Mohamed_Samy-0a66c2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/mosamy7/)
[![GitHub](https://img.shields.io/badge/GitHub-mosamy7-333?style=for-the-badge&logo=github)](https://github.com/mosamy7)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-%2B201064266938-25d366?style=for-the-badge&logo=whatsapp)](https://api.whatsapp.com/send?phone=201064266938)
[![Instagram](https://img.shields.io/badge/Instagram-moosamy77-e1306c?style=for-the-badge&logo=instagram)](https://www.instagram.com/moosamy77)
[![YouTube](https://img.shields.io/badge/YouTube-mosamy7-ff0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/@mosamy7)
[![Linktree](https://img.shields.io/badge/Linktree-All_Links-39e09b?style=for-the-badge)](https://linktr.ee/mohamed.samy7)

<br>

---

*© 2026 AttendX — Developed with ❤️ by Mohamed Samy*

<br>

</div>
