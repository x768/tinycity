'use strict';

const M_WATER    = 0x0000;
const M_LAND     = 0x0001;
const M_TREE     = 0x0002 | M_LAND;
const M_RUBBLE   = 0x0004 | M_LAND;
const M_ROAD_WT  = 0x0010;
const M_RAIL_WT  = 0x0020;
const M_WIRE_WT  = 0x0040;
const M_RDRLWR_WT= M_ROAD_WT | M_RAIL_WT | M_WIRE_WT;
const M_ROAD     = M_ROAD_WT | M_LAND;
const M_RAIL     = M_RAIL_WT | M_LAND;
const M_WIRE     = M_WIRE_WT | M_LAND;
const M_ROADRAIL = M_ROAD | M_RAIL;
const M_ROADWIRE = M_ROAD | M_WIRE;
const M_RAILWIRE = M_RAIL | M_WIRE;
const F_CENTER   = 0x8000;
const F_BLDGS    = 0x3F00 | M_WIRE | M_RAIL;
const M_R_ZONE   = 0x0100 | M_WIRE;
const M_C_ZONE   = 0x0200 | M_WIRE;
const M_I_ZONE   = 0x0300 | M_WIRE;
const M_HOSPITAL = 0x0400 | M_WIRE;
const M_SCHOOL   = 0x0500 | M_WIRE;
const M_POLICE_D = 0x0600 | M_WIRE;
const M_FIRE_D   = 0x0700 | M_WIRE;
const M_STATION  = 0x0800 | M_WIRE | M_RAIL;
const M_GOODS_ST = 0x0900 | M_WIRE | M_RAIL;
const M_STADIUM1 = 0x0A00 | M_WIRE;
const M_STADIUM2 = 0x0B00 | M_WIRE;
const M_PORT     = 0x0C00 | M_WIRE;
const M_COAL_PWR = 0x0D00 | M_WIRE;
const M_GAS_PWR  = 0x0E00 | M_WIRE;
const M_NUKE_PWR = 0x0F00 | M_WIRE;
const M_AIRPORT  = 0x1000 | M_WIRE;
const M_GIFT_WT  = 0x2000;
const M_YR_HOUSE = 0x2000 | M_WIRE;
const M_TERM_STN = 0x2100 | M_WIRE | M_RAIL;
const M_POLICE_HQ= 0x2200 | M_WIRE;
const M_FIRE_HQ  = 0x2300 | M_WIRE;
const M_AMUSEMENT= 0x2400 | M_WIRE;
const M_CASINO   = 0x2500 | M_WIRE;
const M_BANK     = 0x2600 | M_WIRE;
const M_M_STATUE = 0x2700 | M_WIRE;
const M_MONOLITH = 0x2800 | M_WIRE;
const M_GARDEN   = 0x2900 | M_WIRE;
const M_ZOO      = 0x2A00 | M_WIRE;

const MF_FIRE      = 1;
const MF_FIRE_TMP  = 2;
const MF_FLOOD     = 4;
const MF_FLOOD_TMP = 8;
const MF_RADIO     = 16;

const SAVEDATA_VERSION = 0;
const MAP_SIZE_DEFAULT = 120;
const GRAPH_YEARS = 12;
const MAP_SIZE_MAX = 256;
const LAND_VALUE_LOW = 16;
const LAND_VALUE_MIDDLE = 32;
const LAND_VALUE_HIGH = 96;

const BUILD_ICON_INFO_TINYCITY = [
    { size: 1, cost:    0, name: 'inspect' },
    { size: 1, cost:    1, name: 'bulldoze' },
    { size: 1, cost:   10, name: 'road' },
    { size: 1, cost:   40, name: 'railroad' },
    { size: 1, cost:    2, name: 'wire' },
    { size: 1, cost:   20, name: 'tree' },
    { size: 3, cost:  100, name: 'r_zone', tile:M_R_ZONE },
    { size: 3, cost:  100, name: 'c_zone', tile:M_C_ZONE },
    { size: 3, cost:  100, name: 'i_zone', tile:M_I_ZONE },
    { size: 3, cost:  300, name: 'station', tile:M_STATION },
    { size: 3, cost:  500, name: 'police_dept', tile:M_POLICE_D },
    { size: 3, cost:  500, name: 'fire_dept', tile:M_FIRE_D },
    { size: 4, cost: 3000, name: 'stadium' },
    { size: 4, cost: 3000, name: 'goods_st' },
    { size: 4, cost: 3000, name: 'sea_port' },
    { size: 6, cost:10000, name: 'airport' },
    { size: 4, cost: 3000, name: 'coal_power_plant' },
    { size: 4, cost: 6000, name: 'gas_power_plant' },
];
const BUILD_ICON_INFO_MICROPOLIS = [
    { size: 1, cost:    0, name: 'inspect' },
    { size: 1, cost:    1, name: 'bulldoze' },
    { size: 1, cost:   10, name: 'road' },
    { size: 1, cost:   20, name: 'railroad' },
    { size: 1, cost:    5, name: 'wire' },
    { size: 1, cost:   10, name: 'tree' },
    { size: 3, cost:  100, name: 'r_zone', tile:M_R_ZONE },
    { size: 3, cost:  100, name: 'c_zone', tile:M_C_ZONE },
    { size: 3, cost:  100, name: 'i_zone', tile:M_I_ZONE },
    { size: 4, cost: 3000, name: 'stadium' },
    { size: 3, cost:  500, name: 'police_dept', tile:M_POLICE_D },
    { size: 3, cost:  500, name: 'fire_dept', tile:M_FIRE_D },
    { size: 4, cost: 5000, name: 'sea_port' },
    { size: 6, cost:10000, name: 'airport' },
    { size: 4, cost: 3000, name: 'coal_power_plant' },
    { size: 4, cost: 5000, name: 'nuke_power_plant' },
];
const BUILD_ICON_INFO_GIFT = {
    your_house:       { size: 3, cost: 100, name: 'your_house', tile:M_YR_HOUSE },
    terminal_station: { size: 3, cost: 100, name: 'terminal_station', tile:M_TERM_STN },
    police_hq:        { size: 3, cost: 100, name: 'police_hq', tile:M_POLICE_HQ },
    fire_hq:          { size: 3, cost: 100, name: 'fire_hq', tile:M_FIRE_HQ },
    amusement_park:   { size: 3, cost: 100, name: 'amusement_park', tile:M_AMUSEMENT },
    casino:           { size: 3, cost: 100, name: 'casino', tile:M_CASINO },
    bank:             { size: 3, cost: 100, name: 'bank', tile:M_BANK },
    monster_statue:   { size: 3, cost: 100, name: 'monster_statue', tile:M_M_STATUE },
    zoo:              { size: 3, cost: 100, name: 'zoo', tile:M_ZOO },
    monolith:         { size: 3, cost: 100, name: 'monolith', tile:M_MONOLITH },
    land_fill:        { size: 3, cost: 100, name: 'land_fill' },
};

function array_rotate_cw(arr, size) {
    let n = Math.floor(size / 2);
    for (let y = 0; y < n; y++) {
        for (let x = y; x < size - y - 1; x++) {
            let tmp = arr[x + y * size];
            arr[x + y * size] = arr[y + (size - x - 1) * size];
            arr[y + (size - x - 1) * size] = arr[(size - x - 1) + (size - y - 1) * size];
            arr[(size - x - 1) + (size - y - 1) * size] = arr[(size - y - 1) + x * size];
            arr[(size - y - 1) + x * size] = tmp;
        }
    }
}
function array_rotate_ccw(arr, size) {
    let n = Math.floor(size / 2);
    for (let y = 0; y < n; y++) {
        for (let x = y; x < size - y - 1; x++) {
            let tmp = arr[x + y * size];
            arr[x + y * size] = arr[(size - y - 1) + x * size];
            arr[(size - y - 1) + x * size] = arr[(size - x - 1) + (size - y - 1) * size];
            arr[(size - x - 1) + (size - y - 1) * size] = arr[y + (size - x - 1) * size];
            arr[y + (size - x - 1) * size] = tmp;
        }
    }
}
function choice_random(a) {
    return a[Math.floor(Math.random() * a.length)];
}
