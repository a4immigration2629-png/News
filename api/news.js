export default async function handler(req, res) {

    try {

        /*
        ==========================================
        GOOGLE NEWS RSS FEEDS
        ==========================================
        */

        const feeds = [

            {
                name: "Indian Cricket",
                url:
                "https://news.google.com/rss/search?q=Indian+cricket+when:2d&hl=en-IN&gl=IN&ceid=IN:en"
            },

            {
                name: "Team India",
                url:
                "https://news.google.com/rss/search?q=Team+India+cricket+when:2d&hl=en-IN&gl=IN&ceid=IN:en"
            },

            {
                name: "IPL",
                url:
                "https://news.google.com/rss/search?q=IPL+cricket+when:3d&hl=en-IN&gl=IN&ceid=IN:en"
            },

            {
                name: "Indian Cricket Players",
                url:
                "https://news.google.com/rss/search?q=Indian+cricket+players+when:2d&hl=en-IN&gl=IN&ceid=IN:en"
            },

            {
                name: "BCCI",
                url:
                "https://news.google.com/rss/search?q=BCCI+cricket+when:2d&hl=en-IN&gl=IN&ceid=IN:en"
            }

        ];


        /*
        ==========================================
        NEWS ARRAY
        ==========================================
        */

        let articles = [];


        /*
        ==========================================
        FETCH EACH RSS FEED
        ==========================================
        */

        for (const feed of feeds) {

            try {

                const response =
                    await fetch(feed.url, {
                        headers: {
                            "User-Agent":
                            "Mozilla/5.0 Diamond-News"
                        }
                    });


                if (!response.ok) {
                    continue;
                }


                const xml =
                    await response.text();


                /*
                ==================================
                GET RSS ITEMS
                ==================================
                */

                const items =
                    xml.match(
                        /<item[\s\S]*?<\/item>/gi
                    ) || [];


                for (const item of items) {


                    /*
                    ==============================
                    TITLE
                    ==============================
                    */

                    const titleMatch =
                        item.match(
                            /<title[^>]*>([\s\S]*?)<\/title>/i
                        );


                    /*
                    ==============================
                    LINK
                    ==============================
                    */

                    const linkMatch =
                        item.match(
                            /<link[^>]*>([\s\S]*?)<\/link>/i
                        );


                    /*
                    ==============================
                    DATE
                    ==============================
                    */

                    const dateMatch =
                        item.match(
                            /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i
                        );


                    /*
                    ==============================
                    SOURCE
                    ==============================
                    */

                    const sourceMatch =
                        item.match(
                            /<source[^>]*>([\s\S]*?)<\/source>/i
                        );


                    if (!titleMatch || !linkMatch) {
                        continue;
                    }


                    let title =
                        cleanText(titleMatch[1]);


                    let link =
                        cleanText(linkMatch[1]);


                    let date =
                        dateMatch
                        ? cleanText(dateMatch[1])
                        : "";


                    let source =
                        sourceMatch
                        ? cleanText(sourceMatch[1])
                        : feed.name;


                    /*
                    ==================================
                    IMAGE
                    ==================================
                    */

                    let image =
                        getImage(item);


                    /*
                    ==================================
                    DESCRIPTION
                    ==================================
                    */

                    const descriptionMatch =
                        item.match(
                            /<description[^>]*>([\s\S]*?)<\/description>/i
                        );


                    let description =
                        descriptionMatch
                        ? descriptionMatch[1]
                        : "";


                    /*
                    If image wasn't found in media tags,
                    try to find image inside description.
                    */

                    if (!image) {

                        image =
                            getImageFromHTML(
                                description
                            );

                    }


                    /*
                    ==================================
                    CLEAN GOOGLE NEWS LINK
                    ==================================
                    */

                    link =
                        cleanLink(link);


                    /*
                    ==================================
                    PUSH ARTICLE
                    ==================================
                    */

                    if (title && link) {

                        articles.push({

                            title: title,

                            link: link,

                            source: source,

                            date: date,

                            image: image || ""

                        });

                    }

                }

            } catch (feedError) {

                console.error(
                    "Feed error:",
                    feedError
                );

            }

        }


        /*
        ==========================================
        REMOVE DUPLICATES
        ==========================================
        */

        const uniqueArticles = [];

        const seen = new Set();


        for (const article of articles) {

            const key =
                article.title
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();


            if (!seen.has(key)) {

                seen.add(key);

                uniqueArticles.push(article);

            }

        }


        /*
        ==========================================
        NEWEST FIRST
        ==========================================
        */

        uniqueArticles.sort((a,b) => {

            const dateA =
                new Date(a.date).getTime() || 0;

            const dateB =
                new Date(b.date).getTime() || 0;

            return dateB - dateA;

        });


        /*
        ==========================================
        SEND MAXIMUM 50 NEWS ARTICLES
        ==========================================
        */

        const result =
            uniqueArticles.slice(0,50);


        /*
        ==========================================
        CACHE
        ==========================================
        */

        res.setHeader(
            "Cache-Control",
            "s-maxage=300, stale-while-revalidate=600"
        );


        /*
        ==========================================
        RESPONSE
        ==========================================
        */

        res.status(200).json(result);


    } catch (error) {

        console.error(
            "News API Error:",
            error
        );


        res.status(500).json({

            error:
            "Unable to load cricket news"

        });

    }

}


/*
==================================================
CLEAN RSS TEXT
==================================================
*/

function cleanText(text) {

    if (!text) {
        return "";
    }


    return String(text)

        .replace(
            /<!\[CDATA\[/gi,
            ""
        )

        .replace(
            /\]\]>/gi,
            ""
        )

        .replace(
            /<[^>]*>/g,
            ""
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /&apos;/gi,
            "'"
        )

        .replace(
            /&lt;/gi,
            "<"
        )

        .replace(
            /&gt;/gi,
            ">"
        )

        .replace(
            /&#x27;/gi,
            "'"
        )

        .replace(
            /&#x2F;/gi,
            "/"
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/*
==================================================
GET IMAGE FROM MEDIA CONTENT
==================================================
*/

function getImage(item) {

    let match;


    /*
    media:content
    */

    match =
        item.match(
            /<media:content[^>]+url=["']([^"']+)["']/i
        );

    if (match && match[1]) {

        return decodeURL(match[1]);

    }


    /*
    media:thumbnail
    */

    match =
        item.match(
            /<media:thumbnail[^>]+url=["']([^"']+)["']/i
        );

    if (match && match[1]) {

        return decodeURL(match[1]);

    }


    /*
    enclosure
    */

    match =
        item.match(
            /<enclosure[^>]+url=["']([^"']+)["']/i
        );

    if (match && match[1]) {

        return decodeURL(match[1]);

    }


    return "";

}


/*
==================================================
GET IMAGE FROM DESCRIPTION HTML
==================================================
*/

function getImageFromHTML(html) {

    if (!html) {
        return "";
    }


    const match =
        html.match(
            /<img[^>]+src=["']([^"']+)["']/i
        );


    if (match && match[1]) {

        return decodeURL(match[1]);

    }


    /*
    Try data-src
    */

    const lazy =
        html.match(
            /<img[^>]+data-src=["']([^"']+)["']/i
        );


    if (lazy && lazy[1]) {

        return decodeURL(lazy[1]);

    }


    return "";

}


/*
==================================================
CLEAN LINK
==================================================
*/

function cleanLink(link) {

    if (!link) {
        return "";
    }


    link =
        link
            .replace(
                /<!\[CDATA\[/gi,
                ""
            )
            .replace(
                /\]\]>/gi,
                ""
            )
            .trim();


    /*
    Decode HTML entities
    */

    link =
        link
            .replace(
                /&amp;/gi,
                "&"
            )
            .replace(
                /&quot;/gi,
                '"'
            );


    return link;

}


/*
==================================================
DECODE IMAGE URL
==================================================
*/

function decodeURL(url) {

    if (!url) {
        return "";
    }


    return String(url)

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .trim();

}
