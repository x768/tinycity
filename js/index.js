'use strict';

function Popup()
{
    const window_back = document.getElementById('popup-window-back');
    const title = document.getElementById('popup-title');
    const content = document.getElementById('popup-text');

    let callback = null;

    this.show = function(cb) {
        window_back.style.display = 'block';
        cb = callback;
    };
    this.set_title = function(city, year) {
        title.textContent = city + " " + resource.yearstr(year);
    };
    this.set_content = function(text) {
        content.textContent = text;
    };

    window_back.addEventListener('click', e => {
        window_back.style.display = '';
        callback('cancel');
    });
    document.getElementById('popup-cancel').addEventListener('click', e => {
        window_back.style.display = '';
        callback('cancel');
    });
    document.getElementById('popup-ok').addEventListener('click', e => {
        window_back.style.display = '';
        callback('ok');
    });
}
function ScenarioMessage()
{
    const res = {
        cisco: {
            en: "Damage from the earthquake was minor compared to that of the ensuing fires, which kills 1500 peoples.\nControlling the fires shuld be your initial concern.\nThen clear the rubble and start rebuilding.\nYou have 5 years.",
            ja: "サンフランシスコを襲った地震は大規模な火災を引き起こしました。これにより1500人もの命が奪われました。\nあなたの使命は、火災を鎮め、瓦礫を撤去し、街を再建することです。\n任期は5年です。",
        },
        bern: {
            en: "The roads here are becoming more congested every day.\nSome have suggested a railway as the answer, but this would require major rezoning in the downtown area.\nYou have 10 years.",
            ja: "この街の交通渋滞は日に日に悪化しています。\n鉄道の導入が一つの解決策ですが、市街地の大規模な再開発が必要です。\n任期は10年です。",
        },
        tokyo: {
            en: "A large creature has been spotted heading for Tokyo bay. It seems to be attracted to the heavy pollution there.\nTry to control the fires, then rebuild the industrial center.\nYou have 5 years.",
            ja: "巨大な生物が東京湾に出現しました。この生物は公害に汚染された都市に出現するそうです。\nあなたの使命は、火災を鎮め、工業地帯を再建することです。\n任期は5年です。",
        },
        detroit: {
            en: "By 1970, various economic factors pushed the once \"automobile capital of the world\" into resession, then increased crime.\nTry to reduce crime and rebuild the industrial base of the city.\nYou have 10 years.",
            ja: "1970年代、世界の自動車産業の中心だったデトロイトは衰退し、犯罪が増加しました。\nあなたの使命は、犯罪を抑え、工業都市を再建することです。\n任期は10年です。",
        },
    };

    this.gettext = function(lang, city) {
        let m = res[city];
        if (m[lang] != null) {
            return m[lang];
        } else {
            return m.en;
        }
    };
}

(fn => {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
})(() => {
    const popup = new Popup();
    const scenario_msg = new ScenarioMessage();
    let lang_select = document.getElementById('lang-select');

    lang_select.addEventListener('change', e => {
        resource.set_language(lang_select.value, () => {
            document.getElementById('menu-help').setAttribute('href', (lang_select.value === 'ja') ? 'docs/help.ja.html' : 'docs/help.en.html');

            let re = document.getElementsByClassName('resource');
            for (let i = 0; i < re.length; i++) {
                re[i].textContent = resource.gettext(re[i].getAttribute('data-key'));
            }
            document.getElementById('popup-cancel-text').textContent = resource.gettext('cancel');
            document.getElementById('popup-ok-text').textContent = resource.gettext('ok');
        });
    });

    function city_open(e) {
        let t = e.currentTarget;
        let city_name = t.getElementsByClassName('city-list-name')[0].textContent;
        let year = t.getElementsByClassName('city-list-year')[0].textContent;
        let name = t.getAttribute('data-city');
        popup.set_title(city_name, year);
        popup.set_content(scenario_msg.gettext(resource.current_language, name));
        popup.show(m => {
            if (m === 'ok') {
            }
        });
    }

    let li = document.getElementsByClassName('city-list-item');
    for (let i = 0; i < li.length; i++) {
        li[i].addEventListener('click', city_open);
    }

    resource.init(() => {
        for (let i = 0; i < resource.language_menu.length; i++) {
            let m = resource.language_menu[i];
            let option = document.createElement('option');
            option.textContent = m.text_raw;
            option.value = m.value.substr(5);
            lang_select.appendChild(option);
        }
        lang_select.value = resource.current_language;
        lang_select.dispatchEvent(new Event('change'));
    });
});
