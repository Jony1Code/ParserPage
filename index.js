const puppeteer = require("puppeteer");
const process = require("process");
const readline = require("readline");
const fs = require("fs");

const {
  BUTTON_SELECTOR,
  UL_SELECTOR,
  PATH_SCREENSHOT,
  BASE_URL,
  SELECTOR_PRICE,
  SELECTOR_RATING,
  SELECTOR_REVIEWS,
  TIMEOUT,
  PATH_TEXT,
} = require("./const");

const cities = [
  "Москва и область",
  "Санкт-Петербург и область",
  "Владимирская обл.",
  "Калужская обл.",
  "Рязанская обл.",
  "Тверская обл.",
  "Тульская обл.",
];

(async function () {
  const url = process.argv[2];

  if (!url.includes(BASE_URL)) {
    console.error("Usage: node index.js < incorrect url >");
    process.exit(1);
  }

  console.log("Available cities:");
  cities.forEach((city, index) => {
    console.log(`${index + 1}. ${city}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let cityIndex;

  rl.question("Please enter a city number: ", async (answer) => {
    cityIndex = parseInt(answer, 10) - 1;
    if (cityIndex >= 0 && cityIndex < cities.length) {
      console.log(`You chose: ${cities[cityIndex]}`);
      parsePage(url, cities[cityIndex]);
    } else {
      console.error(
        "Invalid choice number. Please choose from the available options."
      );
    }
    rl.close();
  });
})();

async function parsePage(url, addres) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  const { width, height } = await page.evaluate(() => ({
    width: window.screen.width,
    height: window.screen.height,
  }));

  await page.setViewport({ width, height });

  await page.goto(url);

  await page.click(BUTTON_SELECTOR);

  const element = await page.$(UL_SELECTOR);

  const listValue = await element.evaluate((ul) => {
    const listItems = ul ? ul.querySelectorAll("li") : [];
    const valuesArray = Array.from(listItems).map((item) =>
      item.textContent.trim()
    );
    return valuesArray;
  });

  if (listValue.length > 0) {
    const targetIndex = listValue.indexOf(addres);
    if (targetIndex !== -1) {
      const listItemSelector = `.UiRegionListBase_list__cH0fK li:nth-child(${
        targetIndex + 1
      })`;
      await page.click(listItemSelector);
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
    }
  }

  const data = await getData(page);

  const jsonData = JSON.stringify(data, null, 2);

  fs.writeFileSync(PATH_TEXT, jsonData);

  console.log(`Данные успешно сохранены в файл: ${PATH_TEXT}`);

  const currentPosition = await page.evaluate(() => {
    return window.scrollY;
  });

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.evaluate((position) => {
    window.scrollTo(0, position);
  }, currentPosition);

  await new Promise((resolve) => setTimeout(resolve, TIMEOUT));

  await page.screenshot({ path: PATH_SCREENSHOT, fullPage: true });

  console.log(`Скриншот успешно сохранен в файл: ${PATH_SCREENSHOT}`);

  await browser.close();
}

async function getData(page) {
  const result = {};
  try {
    await page.waitForSelector(SELECTOR_PRICE, { timeout: TIMEOUT });
    const elementPrice = await page.$(SELECTOR_PRICE);
    const { price, priceOld } = await getPrice(elementPrice);
    result.price = price;
    result.priceOld = priceOld;
  } catch (error) {
    console.error(
      "Произошла ошибка при ожидании селектора SELECTORPRICE:",
      error
    );
    result.price = "Недоступен для заказа";
    result.priceOld = "Недоступен для заказа";
  }

  try {
    await page.waitForSelector(SELECTOR_RATING, { timeout: TIMEOUT });
    const elementRating = await page.$(SELECTOR_RATING);
    result.ratig = await getRating(elementRating);
  } catch (error) {
    console.error(
      "Произошла ошибка при ожидании селектора SELECTORRATING:",
      error
    );
    result.ratig = undefined;
  }

  try {
    await page.waitForSelector(SELECTOR_REVIEWS, { timeout: TIMEOUT });
    const elementReviews = await page.$(SELECTOR_REVIEWS);
    result.reviewCount = await getReviews(elementReviews);
  } catch (error) {
    console.error(
      "Произошла ошибка при ожидании селектора SELECTORREVIEWS:",
      error
    );
    result.reviewCount = undefined;
  }

  return result;
}

async function getPrice(element) {
  const result = {};

  const priceElement =
    (await element.$(".Price_role_discount__l_tpE")) ??
    (await element.$("span"));
  const priceOldElement = await element.$("span");

  const priceOld = await priceOldElement.evaluate((node) => node.textContent);
  const price = await priceElement.evaluate((node) => node.textContent);

  if (price !== priceOld) {
    result.priceOld = priceOld;
    result.price = price;
  } else {
    result.price = price;
  }

  return result;
}

async function getRating(element) {
  return await element.evaluate((el) => el.textContent);
}

async function getReviews(element) {
  return await element.evaluate((el) => el.textContent);
}
