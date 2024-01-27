const {get} = require("axios")
const YAML = require('yaml')
const fs = require('fs')
const path = require('path')


const data301 = require("../data/mys/gi/avatar.json")
const data302 = require("../data/mys/gi/weapon.json")
const data11 = require("../data/mys/hsr/avatar.json")
const data12 = require("../data/mys/hsr/equipment.json")

const versionNum = [[1, 6], [2, 8], [3, 8], [4, 8]]

const versions = versionNum.map(([a, b]) => Array.from(new Array(b + 1).keys()).map(v => [`${a}.${v}.1`, `${a}.${v}.2`].join(';')).join(";")).join(";").split(";")


const findObj = (name, Obj) => {
    if (!name) {
        return ""
    }
    if (Object.keys(Obj).includes(name + "")) {
        return Obj[name + ""]
    }
    return name
}
//replace nickName or abbr.
let nickNames = {
    "鼬鼠党欢迎你": "鼹鼠党欢迎你",
    "点个关注吧": "点个关注吧！",
    "『我』的诞生":"「我」的诞生",
}

const getName = name => findObj(name, nickNames)

let weaponTypes = {
    "1": "Sword",
    "10": "Catalyst",
    "11": "Claymore",
    "12": "Bow",
    "13": "Polearm"
}

let elements = {
    "1": "Pyro",
    "2": "Anemo",
    "3": "Geo",
    "4": "Dendro",
    "5": "Electro",
    "6": "Hydro",
    "7": "Cryo",
}

let damageTypes = {
    "1": "physical",
    "2": "fire",
    "4": "ice",
    "8": "thunder",
    "16": "wind",
    "32": "quantum",
    "64": "imaginary",
}

let paths = {
    "1": "warrior",
    "2": "rogue",
    "3": "mage",
    "4": "shaman",
    "5": "warlock",
    "6": "knight",
    "7": "priest",
}

const getWeaponType = name => findObj(name, weaponTypes)
const getElement = name => findObj(name, elements)
const getDamageType = name => findObj(name, damageTypes)
const getPath = name => findObj(name, paths)

const getId2 = (name, pool) => {
    switch (pool) {
        case 11:
        case 12: {
            let data = pool === 11 ? data11 : data12
            let name2 = getName(name)

            let find = data.find(a => a.item_name === name2)
            if (!find) {
                console.log(`${pool},${name}无对应数据`)
                return
            }
            let imageUrl = find.icon_url ? find.icon_url : find.item_url
            return {
                itemId: +find.item_id,
                damageType: find.damage_type,
                element: getDamageType(find.damage_type),
                imageUrl: imageUrl?.replace("https://act-webstatic.mihoyo.com", ""),
                rankType: +find.rarity,
                avatarBaseType: find.avatar_base_type,
                weaponType: getPath(find.avatar_base_type),
                itemType: pool === 11 ? "Character" : "Weapon",
                name: find.item_name,

            }
        }
        case 301:
        case 302: {
            let data = pool === 301 ? data301 : data302
            let name2 = getName(name)
            let find = data.find(a => a.name === name2)
            if (!find) {
                console.log(`${pool},${name}无对应数据`)
                return
            }
            return {
                itemId: find.id,
                weaponType: getWeaponType(find.weapon_cat_id),
                imageUrl: find.icon?.replace("https://act-webstatic.mihoyo.com", ""),
                rankType: find.avatar_level ? find.avatar_level : find.weapon_level,
                itemType: pool === 301 ? "Character" : "Weapon",
                name: find.name,
                nameEn: "",
                element: getElement(find.element_attr_id)
            }
        }
        default:
            console.log(`${pool},${name}无对应数据`)
    }
}


const getVersion = (i, pool) => {
    let versionsTemp = versions.slice(0)
    if (pool === 301) {
        //genshin Character
        versionsTemp = [...versionsTemp, "1.3.3"].sort()
    }
    return versionsTemp[i]
}
const fetchGachaData = async (pool, savePath) => {

    //https://gitee.com/yoimiya-kokomi/Yunzai-Bot/raw/main/plugins/genshin/defSet/pool/${pool}.yaml
    //https://gitee.com/yoimiya-kokomi/Miao-Yunzai/raw/master/plugins/genshin/defSet/pool/${pool}.yaml
    //https://genshin-gacha-banners-keypj.vercel.app/${pool}.yaml
    const res = await get(` https://genshin-gacha-banners.52v6.com/pool/${pool}.yaml`, {
        // `proxy` means the request actually goes to the server listening
        // on localhost:3000, but the request says it is meant for
        // 'http://httpbin.org/get?answer=42'
        // proxy: {
        //     host: '127.0.0.1',
        //     port: 17890
        // }
    })
    const parse = (YAML.parse(res.data)).reverse()
    const data = parse.map((gachaData, i) => {
        const {from, to, five, four} = gachaData
        const info5 = five.map(c => getId2(c, pool))
        const info4 = four.map(c => getId2(c, pool))
        return {
            version: getVersion(i, pool), items: [...info5, ...info4].filter(a => !!a), start: from, end: to,
        }
    })
    const characterFilePath = path.join(__dirname, `../data/gacha/${savePath.toLowerCase()}.json`)
    fs.writeFileSync(characterFilePath, JSON.stringify(data.reverse(), "", "\t"))
}

(async () => {
    await fetchGachaData(301, "GI/Character")
    await fetchGachaData(302, "GI/Weapon")
    await fetchGachaData(11, "HSR/Character")
    await fetchGachaData(12, "HSR/Weapon")
})()

