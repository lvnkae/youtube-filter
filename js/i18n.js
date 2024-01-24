async function getLanguage() {
    let lang=window.navigator.language;
    if(["zh-Hans","zh-SG","zh-CN","zh"].includes(lang)) lang="zh-CN";
    if(["zh-Hant","zh-HK","zh-TW","zh-MO"].includes(lang)) lang="zh-TW";
    try {
        let response = await fetch('../i18n/' + lang + '.json');
        if (response.ok) {
            lang = lang;
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
    try {
        let response = await fetch('../i18n/' + lang.split('-')[0] + '.json');
        if (response.ok) {
            lang = lang.split('-')[0];
        } else {
            lang = 'en';
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
    return lang;
}


getLanguage().then(lang=>{
    i18next.use(i18nextHttpBackend).init({
        backend: {
            loadPath: '../i18n/' + lang + '.json',
            addPath: "../i18n/en.json"
        },
        lng: lang,
        debug: true
    }, function (err, t) {
        jqueryI18next.init(i18next, $);
        $('[data-i18n]').localize();
    });
});
