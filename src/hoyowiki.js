const axios = require("axios")
const fs = require("fs")
const path = require('path')

axios.defaults.withCredentials = true


let params = [
    {
        game: "genshin",
        menu_id: "2",
        type: "character",
    },
    {
        game: "genshin",
        menu_id: "4",
        type: "weapon",
    },
    {
        game: "hsr",
        menu_id: "104",
        type: "character",
    },
    {
        game: "hsr",
        menu_id: "107",
        type: "weapon",
    },
    {
        game: "zzz",
        menu_id: "8",
        type: "character",
    },
    {
        game: "zzz",
        menu_id: "11",
        type: "weapon",
    },
]

let languages = ['zh-cn', 'en-us']

let getConfig = (game, language, menu_id, page_num, page_size = 50) => ({
    method: 'post',
    url: `https://sg-wiki-api.hoyolab.com/hoyowiki/${game}/wapi/get_entry_page_list`,
    headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json;charset=UTF-8',
        'referer': 'https://wiki.hoyolab.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'x-rpc-language': `${language}`,
        'x-rpc-wiki_app': `${game}`
    },
    data: JSON.stringify({
        filters: [],
        menu_id: menu_id,
        page_num: page_num,
        page_size: page_size,
        use_es: true
    })
})

async function fetchAllPages(id) {
    for (let language of languages) {
        for (let param of params.filter(a => !id || a.game === id)) {
            let game = param.game
            let menu_id = param.menu_id
            let type = param.type
            let list = []
            try {
                let page_num = 1
                let page_size = 50
                let response = await axios(getConfig(game, language, menu_id, page_num, page_size))
                let data = response.data.data
                if (data && data.list) {
                    const {list: initialList, total} = data
                    list = list.concat(initialList)
                    let maxPageNum = Math.ceil(total / page_size)

                    for (let i = 2; i <= maxPageNum; i++) {
                        let response = await axios(getConfig(game, language, menu_id, i, page_size))
                        list = list.concat(response.data.data.list)
                    }

                    console.log(`Total items for ${game}-${language}-${type}:`, total, list.length)

                    let directoryPath = path.join(__dirname, `../data/hoyowiki/${game}`, `${language}`)
                    if (!fs.existsSync(directoryPath)) {
                        fs.mkdirSync(directoryPath, {recursive: true})
                    }
                    fs.writeFileSync(path.join(directoryPath, `${type}.json`), JSON.stringify(list.sort((a, b) => a.entry_page_id - b.entry_page_id), null, "\t"))
                }
            } catch (error) {
                console.error(`Error fetching pages for ${game}-${language}-${type}:`, error)
            }
        }
    }
}

let id = process.argv.slice(2)[0] || ""
fetchAllPages(id)


//https://api-takumi-static.mihoyo.com/common/blackboard/zzz_wiki/v1/home/content/list?app_sn=zzz_wiki&channel_id=43
//https://api-takumi-static.mihoyo.com/common/blackboard/zzz_wiki/v1/home/content/list?app_sn=zzz_wiki&channel_id=45
