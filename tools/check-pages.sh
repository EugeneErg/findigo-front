#!/usr/bin/env bash
# Проверка страниц на живых данных: серверный рендер, переезды, 404.
#
# Нужны: API с данными сквозного сценария бэка (api/tools/smoke.sh)
# и собранный фронт, запущенный на $WEB (по умолчанию :3100).
#
#   tools/check-pages.sh [WEB] [API]
set -uo pipefail

WEB="${1:-http://127.0.0.1:3100}"
API="${2:-http://127.0.0.1:8123/api}"
FAILED=0

check() { # описание фактическое ожидаемое
    if [[ "$2" == "$3" ]]; then
        echo "  ok   $1"
    else
        echo "  FAIL $1: получено «$2», ожидалось «$3»"
        FAILED=1
    fi
}
status() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -H 'Accept: text/html' "${@:2}" "$WEB$1"; }
html() { curl -s -H 'Accept: text/html' "$WEB$1"; }

echo "Язык"
check "корень — на язык посетителя" "$(status / -H 'Accept-Language: ru-RU,ru;q=0.9')" "302 $WEB/ru"
check "языка нет в репозитории — всё равно язык посетителя" "$(status / -H 'Accept-Language: sw')" "302 $WEB/sw"
check "браузер языка не сказал — язык страны (CDN)" "$(status / -H 'Accept-Language:' -H 'CF-IPCountry: BR')" "302 $WEB/pt"
check "ничего не известно — английский" "$(status / -H 'Accept-Language:')" "302 $WEB/en"
check "языка не существует — 404" "$(status /xx)" "404 "
check "любой язык ICU — страница есть" "$(status /haw)" "200 "
check "тексты на языке адреса" "$(html /ru | grep -o '<html[^>]*lang="ru"' | head -1)" '<html  lang="ru"'
check "страница ошибки — на языке адреса" "$(html /ru/nothing-here | grep -c 'Здесь ничего нет')" "1"

echo "Объявление"
AD="$(curl -s "$API/ads/by-number/1" -H 'Accept: application/json' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("number", ""))')"
if [[ -z "$AD" ]]; then
    echo "  нет объявления №1: сначала api/tools/smoke.sh на свежей базе"
    exit 1
fi
SLUG="$(curl -s "$API/ads/by-number/1?lang=ru" -H 'Accept: application/json' | python3 -c 'import json,sys; print(json.load(sys.stdin)["slug"])')"
check "по одному номеру — переезд на текущие слова" "$(status /ru/1)" "301 $WEB/ru/$SLUG-1"
check "по старым словам — тоже" "$(status /ru/old-words-1)" "301 $WEB/ru/$SLUG-1"
PAGE="$(html "/ru/$SLUG-1")"
check "рендер на сервере: заголовок в HTML" "$(grep -c '<h1' <<<"$PAGE")" "1"
check "канонический адрес" "$(grep -o '<link rel="canonical" href="[^"]*"' <<<"$PAGE")" "<link rel=\"canonical\" href=\"$WEB/ru/$SLUG-1\""
check "OG-заголовок для превью в мессенджерах" "$(grep -c '<meta property="og:title"' <<<"$PAGE")" "1"
check "нет такого номера — 404" "$(status /ru/999999999)" "404 "

echo "Навигация"
check "главная — верхние группы витрины" "$(html /ru | grep -o 'href="/ru/g/[^"]*"[^>]*>[^<]*' | head -1 | sed 's/.*>//' | xargs)" "Автозапчасти"
GROUP="$(html /ru | grep -o 'href="/ru/g/[^"]*"' | head -1 | sed 's/href="//; s/"$//')"
check "группа: вложенная группа и категории" "$(html "$GROUP" | grep -c 'href="/ru/g/')" "1"
TEMPLATE="$(curl -s "$API/ads/by-number/1" | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["template"]["template_id"])')"
check "карточка шаблона — рендер на сервере" "$(html "/ru/t/$TEMPLATE" | grep -c '<h1')" "1"
check "шаблона нет — 404" "$(status /ru/t/00000000-0000-7000-8000-000000000000)" "404 "

echo "Языки посетителей"
PSQL=(psql -qAt)
before="$("${PSQL[@]}" -c "select coalesce(sum(visits), 0) from visit_stats where lang = 'tr' and country = 'TR'")"
JAR="$(mktemp)"
curl -s -o /dev/null -c "$JAR" -H 'Accept: text/html' -H 'Accept-Language: tr-TR,tr;q=0.9' -H 'CF-IPCountry: TR' "$WEB/tr"
curl -s -o /dev/null -b "$JAR" -H 'Accept: text/html' -H 'Accept-Language: tr-TR,tr;q=0.9' -H 'CF-IPCountry: TR' "$WEB/tr/publish"
sleep 0.5
check "визит — раз за сессию" \
    "$("${PSQL[@]}" -c "select coalesce(sum(visits), 0) - $before from visit_stats where lang = 'tr' and country = 'TR'")" "1"
check "робот визитом не считается" \
    "$(curl -s -o /dev/null -H 'Accept: text/html' -H 'User-Agent: Googlebot/2.1' -H 'Accept-Language: tr' -H 'CF-IPCountry: TR' "$WEB/tr"; sleep 0.3
       "${PSQL[@]}" -c "select coalesce(sum(visits), 0) - $before from visit_stats where lang = 'tr' and country = 'TR'")" "1"
check "исходный файл текстов зарегистрирован при старте" \
    "$("${PSQL[@]}" -c "select count(*) from ui_sources where name = 'web' and messages ? 'site'")" "1"
check "перевод интерфейса на язык посетителя заказан" \
    "$("${PSQL[@]}" -c "select count(*) from ui_catalogs where name = 'web' and lang = 'tr'")" "1"
SELL="$(python3 -c 'import json; print(json.load(open("i18n/locales/en.json"))["nav"]["publish"])')"
check "до перевода — по-английски" "$(html /tr | grep -q ">$SELL<" && echo да || echo нет)" "да"
(cd ../api && TRANSLATOR_BACKEND=pseudo php artisan i18n:ui >/dev/null)
check "после очереди — на языке посетителя" "$(html /tr | grep -q "\[tr\] $SELL" && echo да || echo нет)" "да"
check "переключатель — все языки ICU" "$(html /ru | grep -o '<option' | wc -l | awk '{print ($1 > 150)}')" "1"
check "файл из репозитория важнее машинного" "$(html /ru | grep -q '\[ru\] ' && echo да || echo нет)" "нет"
rm -f "$JAR"

[[ $FAILED -eq 0 ]] && echo "Всё прошло." || exit 1
