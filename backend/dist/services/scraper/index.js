import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];
function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
export function hashUrl(url) {
    return crypto.createHash("md5").update(url).digest("hex");
}
function delay(ms) {
    const jitter = Math.random() * 3000;
    return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                headers: { "User-Agent": getRandomUA() },
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            if (i === retries - 1)
                throw error;
            await delay(2000);
        }
    }
    throw new Error("Max retries exceeded");
}
export async function scrapeEastmoney() {
    try {
        const url = "https://np-listapi.eastmoney.com/comm/web/getNewsByColumns?client=web&biz=web_news_col&column=350&order=1&needInteractData=0&page_index=1&page_size=20";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (data?.data?.list) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.data.list) {
                const newsUrl = item.url || `https://finance.eastmoney.com/a/${item.newsID}.html`;
                newsList.push({
                    title: (item.title || "").trim(),
                    content: (item.digest || item.title || "").trim(),
                    source: "eastmoney",
                    url: newsUrl,
                    publishedAt: new Date(item.showTime || Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title);
    }
    catch (error) {
        console.error("[东方财富] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeSina() {
    try {
        const url = "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=20&page=1&r=0." +
            Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (data?.result?.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.result.data) {
                newsList.push({
                    title: (item.title || "").trim(),
                    content: (item.intro || item.title || "").trim(),
                    source: "sina",
                    url: item.url || "",
                    publishedAt: new Date(item.createtime || Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title && n.url);
    }
    catch (error) {
        console.error("[新浪财经] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeTHS() {
    try {
        const url = "https://news.10jqka.com.cn/tapp/news/push?stock=&page=1&limit=20&type=0";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (typeof data === "object" && data?.data?.list) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.data.list) {
                newsList.push({
                    title: (item.title || "").trim(),
                    content: (item.digest || item.title || "").trim(),
                    source: "ths",
                    url: item.url || `https://news.10jqka.com.cn/${item.id}.html`,
                    publishedAt: new Date(item.time || Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title);
    }
    catch (error) {
        console.error("[同花顺] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeXueqiu() {
    try {
        const url = "https://xueqiu.com/statuses/hot/listV2.json?since_id=-1&max_id=0&size=20";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (data?.items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.items) {
                const original = item.original_status || item;
                newsList.push({
                    title: (original.title || original.text || "")
                        .trim()
                        .substring(0, 200),
                    content: (original.text || original.description || "")
                        .trim()
                        .substring(0, 500),
                    source: "xueqiu",
                    url: `https://xueqiu.com/${original.user?.id || ""}/${original.id || ""}`,
                    publishedAt: new Date(original.created_at ? original.created_at * 1000 : Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title);
    }
    catch (error) {
        console.error("[雪球] 采集失败:", error.message);
        return [];
    }
}
export async function scrape36Kr() {
    try {
        const url = "https://36kr.com/api/newsflash/index?per_page=20&page=1";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (data?.data?.items) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.data.items) {
                newsList.push({
                    title: (item.title || "").trim(),
                    content: (item.description || item.digest || item.title || "").trim(),
                    source: "36kr",
                    url: item.news_url || `https://36kr.com/newsflash/${item.item_id}`,
                    publishedAt: new Date(item.published_at || Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title);
    }
    catch (error) {
        console.error("[36Kr] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeJiemian() {
    try {
        const url = "https://www.jiemian.com/lists/latest.html";
        const html = await axios.get(url, {
            headers: { "User-Agent": getRandomUA() },
            timeout: 10000,
        });
        const $ = cheerio.load(html.data);
        const newsList = [];
        $(".article-item").each((_, el) => {
            const title = $(el).find("h3 a, .title a").text().trim();
            const content = $(el).find("p").text().trim();
            const href = $(el).find("h3 a, .title a").attr("href");
            const time = $(el).find(".time, .date").text().trim();
            if (title && href) {
                newsList.push({
                    title,
                    content: content || title,
                    source: "jiemian",
                    url: href.startsWith("http")
                        ? href
                        : `https://www.jiemian.com${href}`,
                    publishedAt: new Date(time || Date.now()),
                });
            }
        });
        return newsList.slice(0, 20);
    }
    catch (error) {
        console.error("[界面] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeCe36() {
    try {
        const url = "https://www.36credit.com/news/getNewsList";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchWithRetry(url);
        const newsList = [];
        if (data?.data?.list) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of data.data.list) {
                newsList.push({
                    title: (item.title || "").trim(),
                    content: (item.summary || item.title || "").trim(),
                    source: "caixin",
                    url: item.url || `https://economy.caixin.com/${item.id}.html`,
                    publishedAt: new Date(item.publish_time || Date.now()),
                });
            }
        }
        return newsList.filter((n) => n.title);
    }
    catch (error) {
        console.error("[财新] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeEastmoneySearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://so.eastmoney.com/news/s?keyword=${encodedQuery}`;
        console.log(`[东方财富搜索] 访问: ${url}`);
        const html = await axios.get(url, {
            headers: { "User-Agent": getRandomUA() },
            timeout: 15000,
        });
        console.log(`[东方财富搜索] 响应状态: ${html.status}`);
        const $ = cheerio.load(html.data);
        const newsList = [];
        $(".news-item").each((_, el) => {
            const title = $(el).find(".news-item-title a").text().trim();
            const href = $(el).find(".news-item-title a").attr("href");
            const content = $(el).find(".news-item-brief").text().trim();
            const time = $(el).find(".news-item-time").text().trim();
            if (title && href) {
                newsList.push({
                    title,
                    content: content || title,
                    source: "eastmoney_search",
                    url: href.startsWith("http")
                        ? href
                        : `https://so.eastmoney.com${href}`,
                    publishedAt: new Date(time || Date.now()),
                });
            }
        });
        console.log(`[东方财富搜索] 找到 ${newsList.length} 条结果`);
        return newsList.slice(0, 20);
    }
    catch (error) {
        console.error("[东方财富搜索] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeSinaSearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://search.sina.com.cn/?q=${encodedQuery}&range=all&c=news&sort=time`;
        console.log(`[新浪搜索] 访问: ${url}`);
        const html = await axios.get(url, {
            headers: { "User-Agent": getRandomUA() },
            timeout: 15000,
        });
        console.log(`[新浪搜索] 响应状态: ${html.status}`);
        const $ = cheerio.load(html.data);
        const newsList = [];
        $(".result").each((_, el) => {
            const title = $(el).find(".box-result h2 a").text().trim();
            const href = $(el).find(".box-result h2 a").attr("href");
            const content = $(el).find(".box-result p").text().trim();
            const time = $(el).find(".box-result .fgray_time").text().trim();
            if (title && href) {
                newsList.push({
                    title,
                    content: content || title,
                    source: "sina_search",
                    url: href,
                    publishedAt: new Date(time || Date.now()),
                });
            }
        });
        console.log(`[新浪搜索] 找到 ${newsList.length} 条结果`);
        return newsList.slice(0, 20);
    }
    catch (error) {
        console.error("[新浪搜索] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeTHSSearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://so.10jqka.com.cn/s?type=news&key=${encodedQuery}`;
        console.log(`[同花顺搜索] 访问: ${url}`);
        const html = await axios.get(url, {
            headers: { "User-Agent": getRandomUA() },
            timeout: 15000,
        });
        console.log(`[同花顺搜索] 响应状态: ${html.status}`);
        const $ = cheerio.load(html.data);
        const newsList = [];
        $(".news_list").each((_, el) => {
            const title = $(el).find("a").text().trim();
            const href = $(el).find("a").attr("href");
            const time = $(el).find(".time").text().trim();
            if (title && href) {
                newsList.push({
                    title,
                    content: title,
                    source: "ths_search",
                    url: href.startsWith("http")
                        ? href
                        : `https://so.10jqka.com.cn${href}`,
                    publishedAt: new Date(time || Date.now()),
                });
            }
        });
        console.log(`[同花顺搜索] 找到 ${newsList.length} 条结果`);
        return newsList.slice(0, 20);
    }
    catch (error) {
        console.error("[同花顺搜索] 采集失败:", error.message);
        return [];
    }
}
export async function scrapeXueqiuSearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://xueqiu.com/search?q=${encodedQuery}&type=11`;
        console.log(`[雪球搜索] 访问: ${url}`);
        const html = await axios.get(url, {
            headers: {
                "User-Agent": getRandomUA(),
                Referer: "https://xueqiu.com",
                Cookie: "xq_a_token=test_token; xq_r_token=test_r_token",
            },
            timeout: 15000,
        });
        console.log(`[雪球搜索] 响应状态: ${html.status}`);
        const $ = cheerio.load(html.data);
        const newsList = [];
        $(".search-result-list .list-item").each((_, el) => {
            const title = $(el).find(".title").text().trim();
            const href = $(el).find(".title a").attr("href");
            const content = $(el).find(".description").text().trim();
            const time = $(el).find(".time").text().trim();
            if (title && href) {
                newsList.push({
                    title,
                    content: content || title,
                    source: "xueqiu_search",
                    url: href.startsWith("http") ? href : `https://xueqiu.com${href}`,
                    publishedAt: new Date(time || Date.now()),
                });
            }
        });
        console.log(`[雪球搜索] 找到 ${newsList.length} 条结果`);
        return newsList.slice(0, 20);
    }
    catch (error) {
        console.error("[雪球搜索] 采集失败:", error.message);
        return [];
    }
}
// 测试爬虫函数
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        console.log("测试爬虫功能...");
        const testQuery = "人工智能";
        console.log(`\n测试东方财富搜索:`);
        const eastmoneyResults = await scrapeEastmoneySearch(testQuery);
        console.log(`结果数: ${eastmoneyResults.length}`);
        eastmoneyResults.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
        });
        console.log(`\n测试新浪搜索:`);
        const sinaResults = await scrapeSinaSearch(testQuery);
        console.log(`结果数: ${sinaResults.length}`);
        sinaResults.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
        });
        console.log(`\n测试同花顺搜索:`);
        const thsResults = await scrapeTHSSearch(testQuery);
        console.log(`结果数: ${thsResults.length}`);
        thsResults.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
        });
        console.log(`\n测试雪球搜索:`);
        const xueqiuResults = await scrapeXueqiuSearch(testQuery);
        console.log(`结果数: ${xueqiuResults.length}`);
        xueqiuResults.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
        });
    })();
}
export { delay };
//# sourceMappingURL=index.js.map