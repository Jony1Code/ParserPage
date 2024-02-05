const puppeteer = require("puppeteer");
const process = require("process");
const readline = require("readline");

const url = process.argv[2];
if (!url.includes("https://www.vprok.ru")) {
  console.error("Usage: node index.js < incorrect url >");
  process.exit(1);
}

const cities = [
  "Москва и область",
  "Санкт-Петербург и область",
  "Владимирская обл.",
  "Калужская обл.",
  "Рязанская обл.",
  "Тверская обл.",
  "Тульская обл.",
];

console.log("Available cities:");
cities.forEach((city, index) => {
  console.log(`${index + 1}. ${city}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Please enter a city number: ", async (answer) => {
  const cityIndex = parseInt(answer, 10) - 1;
  if (cityIndex >= 0 && cityIndex < cities.length) {
    console.log(`You chose: ${cities[cityIndex]}`);
    await parsePage(url, cities[cityIndex]);
  } else {
    console.error(
      "Invalid choice number. Please choose from the available options."
    );
  }
  rl.close();
});

rl.on("close", () => {
  console.log("\nGoodbye!");
  process.exit(0);
});

async function parsePage(url, addres) {
  const browser = await puppeteer.launch({ headless: false, timeout: 100000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url);
  await page.click(".Region_region__6OUBn");
  const element = await page.$(".UiRegionListBase_list__cH0fK");
  const listValue = await element.evaluate((ul) => {
    const listItems = ul ? ul.querySelectorAll("li") : [];
    const valuesArray = Array.from(listItems).map((item) =>
      item.textContent.trim()
    );
    return valuesArray;
  });
  if (listValue.length > 0) {
    const targetIndex = listValue.indexOf(addres);
    console.log("12121", listValue);
    if (targetIndex !== -1) {
      const listItemSelector = `.UiRegionListBase_list__cH0fK li:nth-child(${
        targetIndex + 1
      })`;
      await page.click(listItemSelector);
    }
  }
  await page.screenshot({ path: "example.png", fullPage: true });

  await browser.close();
}
