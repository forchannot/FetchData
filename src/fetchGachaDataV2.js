const {get} = require("axios")
const YAML = require('yaml')
const fs = require('fs')
const path = require('path')

// 动态加载JSON文件的函数
function requireJson(relativePath) {
    try {
        const fullPath = path.join(__dirname, relativePath) // 构建完整的文件路径
        const fileContent = fs.readFileSync(fullPath, 'utf8') // 读取文件内容
        return JSON.parse(fileContent) // 解析JSON并返回
    } catch (error) {
        console.error('Error reading JSON file:', error)
        return null
    }
}

function getRelativePath(game, type, language = "zh-cn") {
    return `../data/hoyowiki/${game}/${language}/${type}.json`
}

//首字母大写
const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)

const getDataEN = (game, type, id, language = "en-us") => {
    let data = requireJson(getRelativePath(game, type.toLowerCase(), language))
    return data.find(a => +a.entry_page_id === id)
}

const getNameEN = (game, type, id, language = "en-us") => {
    let find = getDataEN(game, type, id, language)
    return find?.name
}

let params = {
    11: {
        game: "hsr",
        type: "Character"
    },
    12: {
        game: "hsr",
        type: "Weapon"
    },
    301: {
        game: "genshin",
        type: "Character"
    },
    302: {
        game: "genshin",
        type: "Weapon"
    },
    2001: {
        game: "zzz",
        type: "Character"
    },
    3001: {
        game: "zzz",
        type: "Weapon"
    },

}

const versionNum = [[1, 6], [2, 8], [3, 8], [4, 8], [5, 8]]

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
    "『我』的诞生": "「我」的诞生",
    "三月七": "三月七 - 存护",
    "维序者·特化型": "维序者-特化型",
}

const getName = name => findObj(name, nickNames)

let weaponTypes = {
    "单手剑": "Sword",
    "法器": "Catalyst",
    "双手剑": "Claymore",
    "弓": "Bow",
    "长柄武器": "Polearm"
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
    "lightning": "thunder",
}

let paths = {
    "destruction": "warrior",
    "hunt": "rogue",
    "erudition": "mage",
    "harmony": "shaman",
    "nihility": "warlock",
    "preservation": "knight",
    "abundance": "priest",
}

const getWeaponType = name => findObj(name, weaponTypes)
const getElement = name => findObj(name, elements)
const getDamageType = name => findObj(name, damageTypes)
const getPath = name => findObj(name, paths)

const getId2 = (name, pool) => {
    let {game, type} = params[pool]
    let data = requireJson(getRelativePath(game, type.toLowerCase()))
    let name2 = getName(name)

    let find = data.find(a => (pool === 2001 ? a.name.includes(name2) : a.name === name2))
    if (!find) {
        console.log(`${pool},${name}无对应数据`)
        return
    }

    let findCN
    if (pool === 2001 || pool === 3001) {
        findCN = find
        find = getDataEN(game, type.toLowerCase(), +find.entry_page_id)
    }

    let returnObj = {
        itemId: +find.entry_page_id,
        imageUrl: new URL(find.icon_url).pathname,
        itemType: type,
        name: find.name,
        nameEn: getNameEN(game, type.toLowerCase(), +find.entry_page_id)
    }

    switch (pool) {
        case 11: {
            let {
                filter_values: {
                    character_combat_type: {value_types: [{enum_string: character_combat_type}]},
                    character_paths: {value_types: [{enum_string: character_paths}]},
                    character_rarity: {value_types: [{enum_string: rarity}]}
                }
            } = find
            return {
                ...returnObj,
                damageType: character_combat_type,
                element: getDamageType(character_combat_type),
                rankType: +rarity,
                avatarBaseType: character_paths,
                weaponType: getPath(character_paths),
            }
        }
        case 12: {
            let {
                filter_values: {
                    equipment_paths: {value_types: [{enum_string: character_paths}]},
                    equipment_rarity: {value_types: [{enum_string: rarity}]}
                }
            } = find
            return {
                ...returnObj,
                rankType: +rarity,
                avatarBaseType: character_paths,
                weaponType: getPath(character_paths),
            }
        }
        case 301: {
            let {
                filter_values: {
                    character_vision: {value_types: [{enum_string: character_vision}]},
                    character_weapon: {values: [character_weapon]},
                    character_rarity: {value_types: [{enum_string: rarity}]}
                }
            } = find
            return {
                ...returnObj,
                weaponType: getWeaponType(character_weapon),
                rankType: +rarity,
                element: capitalizeFirstLetter(character_vision)
            }
        }
        case 302: {
            let {
                filter_values: {
                    weapon_type: {values: [character_weapon]},
                    weapon_rarity: {value_types: [{enum_string: rarity}]}
                }
            } = find
            return {
                ...returnObj,
                weaponType: getWeaponType(character_weapon),
                rankType: +rarity,
            }
        }
        case 2001: {

            let {filter_values} = find
            if (!filter_values || Object.keys(filter_values).length === 0) {
                return returnObj
            }
            let {
                filter_values: {
                    agent_stats: {values: [element]},
                    agent_specialties: {values: [weaponType]},
                    agent_rarity: {values: [rarity]}
                }
            } = find
            return {
                ...returnObj,
                weaponType: weaponType,
                weaponTypeCN: findCN?.filter_values?.agent_specialties?.values[0] || weaponType,
                rankType: rarity === "S" ? 5 : 4,
                element: element,
                elementCN: findCN?.filter_values?.agent_stats?.values[0] || element,
                name: getNameEN(game, type.toLowerCase(), +find.entry_page_id, "zh-cn")
            }
        }
        case 3001: {
            let {filter_values} = find
            if (!filter_values || Object.keys(filter_values).length === 0) {
                return returnObj
            }
            let {
                filter_values: {
                    filter_key_13: {values: [weaponType]},
                    w_engine_rarity: {values: [rarity]},
                }
            } = find
            return {
                ...returnObj,
                weaponType: weaponType,
                weaponTypeCN: findCN?.filter_values?.filter_key_13?.values[0] || weaponType,
                rankType: rarity === "S" ? 5 : 4,
                name: getNameEN(game, type.toLowerCase(), +find.entry_page_id, "zh-cn")
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
const fetchGachaData = async (pool, game, type) => {

    //https://gitee.com/yoimiya-kokomi/Yunzai-Bot/raw/main/plugins/genshin/defSet/pool/${pool}.yaml
    //https://gitee.com/yoimiya-kokomi/Miao-Yunzai/raw/master/plugins/genshin/defSet/pool/${pool}.yaml
    //https://genshin-gacha-banners-keypj.vercel.app/${pool}.yaml
    const res = await get(` https://gitee.com/keypj/Miao-Yunzai/raw/master/plugins/genshin/defSet/pool/${pool}.yaml`, {
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
            version: getVersion(i, pool),
            items: [...info5, ...info4].filter(a => !!a && !!a.rankType),
            start: from,
            end: to,
        }
    })
    if (game === "genshin") {
        game = "gi"
    }
    let directoryPath = path.join(__dirname, `../data/gacha/${game}`)
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, {recursive: true})
    }
    const characterFilePath = path.join(__dirname, `../data/gacha/${game}`, `${type.toLowerCase()}.json`)
    fs.writeFileSync(characterFilePath, JSON.stringify(data.reverse(), "", "\t"))
}


async function fetchData(id) {
    for (let key of Object.keys(params)) {
        let {game, type} = params[key]
        if (!id || game === id) {
            await fetchGachaData(+key, game, type)
        }
    }
}

let id = process.argv.slice(2)[0] || ""
fetchData(id)

