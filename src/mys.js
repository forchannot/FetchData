const axios = require("axios")
const fs = require("fs")
const path = require('path')

axios.defaults.withCredentials = true

//HSR
// GET https://api-takumi.mihoyo.com/event/rpgcalc/avatar/list?game=hkrpg&uid=100960785&region=prod_gf_cn&lang=zh-cn&tab_from=TabAll&page=1&size=100
let hsrUrl = (s) => `https://api-takumi.mihoyo.com/event/rpgcalc/${s}/list?game=hkrpg&uid=100960785&region=prod_gf_cn&lang=zh-cn&tab_from=TabAll&page=1&size=100`
let writeFile = s => axios.get(hsrUrl(s), {}).then(res => {
    const {list} = res.data.data
    fs.writeFileSync(path.join(__dirname, `../data/mys/hsr/${s}.json`), JSON.stringify(list.sort(a => a.item_id), "", "\t"))
})


writeFile("avatar")
writeFile("equipment")

//GI
// POST https://api-takumi.mihoyo.com/event/e20200928calculate/v1/avatar/list
// Referer: https://webstatic.mihoyo.com/
// Cookie:
// Content-Type: application/json;charset=UTF-8
//
// {
//     "page": 1,
//     "size": 100
// }
let gsUrl= (s)=>`https://api-takumi.mihoyo.com/event/e20200928calculate/v1/${s}/list`
let [cookie] = process.argv.slice(2)||["参数获取失败"]

let writeFile2 = s => axios.post(gsUrl(s), JSON.stringify({
    "page": 1,
    "size": 500
}),{
    headers:{
        Referer: "https://webstatic.mihoyo.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        Cookie: cookie
    }
}).then(res => {
    const {list} = res.data.data
    fs.writeFileSync(path.join(__dirname, `../data/mys/gi/${s}.json`), JSON.stringify(list.sort(a => a.item_id), "", "\t"))
})

writeFile2("avatar")
writeFile2("weapon")
