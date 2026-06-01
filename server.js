const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Укажите ID вашей Google Таблицы (из её URL-адреса)
const SPREADSHEET_ID = "ВАШ_ID_ГУГЛ_ТАБЛИЦЫ";

// 2. Подключаем файл ключа сервисного аккаунта Google (скачанный из Google Cloud)
const client = new google.auth.JWT(
  null,
  path.join(__dirname, "google-key.json"), // файл ключа должен лежать в этой же папке
  null,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

app.post("/api/order", async (req, res) => {
  const { market, customer, payment, items } = req.body;
  const date = new Date().toLocaleDateString("ru-RU", {
    timeZone: "Asia/Bishkek",
  });

  // Формируем строки для отправки в таблицу
  // Если жена выбрала 3 товара, мы сделаем 3 отдельные строки в таблице
  const rowsToInsert = items.map((item) => [
    date, // Столбец A: Дата
    market, // Столбец B: Базар
    customer, // Столбец C: Имя клиента
    item.product, // Столбец D: Товар
    item.count, // Столбец E: Количество коробок
    payment, // Столбец F: Тип оплаты (Оплачено/В долг)
  ]);

  try {
    await client.authorize();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Ответы на форму 1!A:F", // Имя листа в вашей таблице
      valueInputOption: "USER_ENTERED",
      resource: { values: rowsToInsert },
    });

    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Ошибка записи в Google Sheets:", error);
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
