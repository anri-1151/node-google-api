var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var express = require('express');
var router = express.Router();

var PdfPrinter = require('pdfmake/src/printer');

var fonts = {
    Roboto: {
        normal: './fonts/bpg_mrgvlovani/bpg_mrgvlovani.ttf',
        bold: './fonts/bpg_mrgvlovani_caps/bpg_mrgvlovani_caps.ttf',
        italics: './fonts/bpg_mrgvlovani/bpg_mrgvlovani.ttf',
        bolditalics: './fonts/bpg_mrgvlovani_caps/bpg_mrgvlovani_caps.ttf'
    },
    Geo: {
        normal: './fonts/bpg_mrgvlovani/bpg_mrgvlovani.ttf',
        bold: './assets/fonts/bpg_mrgvlovani/bpg_mrgvlovani_bold.ttf',
        italics: './fonts/bpg_mrgvlovani/bpg_mrgvlovani_italic.ttf',
        bolditalics: './fonts/bpg_mrgvlovani/bpg_mrgvlovani_bold_italic.ttf'
    },
    GeoMtavruli: {
        normal: './fonts/bpg_mrgvlovani_caps/bpg_mrgvlovani_caps.ttf',
        bold: './fonts/bpg_mrgvlovani_caps/bpg_mrgvlovani_caps_bold.ttf',
        italics: './fonts/bpg_mrgvlovani/bpg_mrgvlovani_italic.ttf',
        bolditalics: './fonts/bpg_mrgvlovani/bpg_mrgvlovani_bold_italic.ttf'
    }
};

var printer = new PdfPrinter(fonts);

router.get('/getPdf', function (req, res) {
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
    var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Sheets API.
        authorize(JSON.parse(content), listMajors);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, function (err, token) {
            if (err) {
                getNewToken(oauth2Client, callback);
            } else {
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
            }
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', function (code) {
            rl.close();
            oauth2Client.getToken(code, function (err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                storeToken(token);
                callback(oauth2Client);
            });
        });
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR);
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err;
            }
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to ' + TOKEN_PATH);
    }


    function listMajors(auth) {
        var sheets = google.sheets('v4');
        sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: '1ExaPunCtTNTCtEoJsY4zKJ9wJtW7nnpfL8Wz67oDbFg',
            range: 'A2:JY56'
            //range: 'A2:JY4'
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var rows = response.values;
            if (rows.length == 0) {
                console.log('No data found.');
            } else {
                var arr = [];
                for (var x = 0; x < rows.length; x++) {
                    var row = rows[x];
                    var d = x!= 0 ? x * 20 : 0;
                    var h1 = x == 0 ? {text: 'ზოგადი ინფორმაცია ' + (x + 1), style: 'header'} : {text: 'ზოგადი ინფორმაცია ' + (x + 1), style: 'header', margin: [0, 570 + d, 0, 0]};
                    arr.push(h1);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    var personText = {
                        text: row[1] + ' რეგისტრაციის დრო: ' + row[0],
                        style: 'small',
                        margin: [0, 20, 0, 0]
                    };
                    var corpusisText = {text: 'საკადასტრო კოდი: ' + row[2] + ' მისამართი: ' + row[3], style: 'small'};
                    var amxanagoba = {text: 'ამხანაგობა: ' + row[4], style: 'small'};
                    var mainPersonText = {
                        text: ' თავმჯდომარე: ' + row[5] + ' მობილური: ' + row[6] + (row[7] ? ' ქალაქის ტელეფონი' : ''),
                        style: 'small'
                    };
                    var redLines = {
                        text: 'განსაზღვრული არის თუ არა წითელი ხაზები: ' + row[8] + ' ფართობი: ' + row[9],
                        style: 'small'
                    };
                    var redLinesComment = {text: 'კომენტარი: ' + row[10], style: 'small'};
                    arr.push(personText);
                    arr.push(corpusisText);
                    arr.push(amxanagoba);
                    arr.push(mainPersonText);
                    arr.push(redLines);
                    arr.push(redLinesComment);
                    var h2 = {text: 'კორპუსის ინფორმაცია', style: 'header'};
                    arr.push(h2);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'ექსპლუატაციაში შესვლის თარიღი: ' + row[11],
                        style: 'small',
                        margin: [0, 20, 0, 0]
                    });
                    arr.push({text: 'კაპიტალური გამაგრების ჩატარების ბოლო თარიღი: ' + row[12], style: 'small'});
                    arr.push({text: 'შენობის კედლის ტიპი: ' + row[13], style: 'small'});
                    arr.push({text: 'შენობის ტიპი: ' + row[14], style: 'small'});
                    arr.push({
                        text: 'სართულების რაოდენობა: ' + row[15] + ' სადარბაზოების რაოდენობა: ' + row[16] + ' ბინების რაოდენობა: ' + row[17],
                        style: 'small'
                    });
                    arr.push({text: 'მიშენება კორპუსზე: ' + row[18], style: 'small'});
                    arr.push({text: 'მიშენების სეისმომედეგობის დამადასტურებელი საბუთი: ' + row[19], style: 'small'});
                    arr.push({text: 'დაშენება კორპუსზე: ' + row[20], style: 'small'});
                    arr.push({text: 'დაშენების სეისმომედეგობის დამადასტურებელი საბუთი: ' + row[21], style: 'small'});
                    arr.push({text: 'ტექნიკური სართული : ' + row[22], style: 'small'});
                    arr.push({text: 'ტექნიკური სართულის სტატუსი : ' + row[23], style: 'small'});
                    arr.push({text: 'შონობის ავარიულობის სტატუსი : ' + row[24], style: 'small'});
                    arr.push({text: 'ავარიულობის შემთხვევაში მითითებული კატეგორია : ' + row[25], style: 'small'});
                    arr.push({text: 'კომენტარი: ' + row[26], style: 'small'});

                    var h3 = {text: 'სახურავი', style: 'header'};
                    arr.push(h3);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({text: 'შენობის სახურავის ტიპი: ' + row[27], style: 'small', margin: [0, 20, 0, 0]});
                    arr.push({text: 'შენობის გადახურვის ტიპი: ' + row[28], style: 'small'});
                    arr.push({text: 'სახურავის საერთო ფართობი: ' + row[28], style: 'small'});
                    arr.push({text: 'სახურავის კაპიტალური რემონტის ჩატარების ბოლო თარიღი: ' + row[28], style: 'small'});
                    arr.push({text: 'არის თუ არა სახურავი სარგებლობის უფლებით გაცემული: ' + row[29], style: 'small'});
                    arr.push({text: 'კომენტარი: ' + row[30], style: 'small'});
                    var h4 = {text: 'სარდაფები', style: 'header'};
                    arr.push(h4);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'არსებული სარდაფების საერთო ფართობი: ' + row[31],
                        style: 'small',
                        margin: [0, 20, 0, 0]
                    });
                    arr.push({text: 'სარდაფების რაოდენობა ბმა-ს საკუთრებაში: ' + row[32], style: 'small'});
                    arr.push({
                        text: 'გაცემული სარდაფების რაოდენობაა სარგებლობის უფლებით, კომერციული მიზნით: ' + row[33],
                        style: 'small'
                    });
                    arr.push({text: 'კომენტარი: ' + row[34], style: 'small'});
                    var h5 = {text: 'სხვენი', style: 'header'};
                    arr.push(h5);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'სხვენის რაოდენობა ბმა-ს საკუთრებაში: ' + row[35],
                        style: 'small',
                        margin: [0, 20, 0, 0]
                    });
                    arr.push({text: 'სარდაფების რაოდენობა ბმა-ს საკუთრებაში: ' + row[36], style: 'small'});
                    arr.push({
                        text: 'გაცემული სარდაფების რაოდენობაა სარგებლობის უფლებით, კომერციული მიზნით: ' + row[37],
                        style: 'small'
                    });
                    arr.push({text: 'კომენტარი: ' + row[38], style: 'small'});
                    for (var i = 1; i <= 6; i++) {
                        var h = {text: i + ' სადარბაზო', style: 'header'};
                        arr.push(h);
                        arr.push({
                            canvas: [{
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 600 - 2 * 40,
                                y2: 0,
                                lineWidth: 3,
                                color: 'grey'
                            }]
                        });
                        arr.push({
                            text: 'სენსორული განათება სადარბაზოებში: ' + row[39 + (i - 1) * 21],
                            style: 'small',
                            margin: [0, 20, 0, 0]
                        });
                        arr.push({
                            text: 'სადარბაზოში დამონტაჟებულია ვიდეო თვალი: ' + row[40 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({text: 'სადარბაზოს აქვს დომოფონი: ' + row[41 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'სადარბაზოს კარის გაღების ტიპი: ' + row[42 + (i - 1) * 21], style: 'small'});
                        arr.push({
                            text: 'სადარბაზო არის შშმ პირებზე ადაპტირებული: ' + row[43 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({
                            text: 'ჯდება თუ არა შშმპ ადაპტირება სტანდარტებში: ' + row[44 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({
                            text: 'როდის გამოიცვალა ელ გაყვანილობა სადარბაზოში: ' + row[45 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({
                            text: 'ცენტრალური წყალკანალიზაციის სტანდარტები: ' + row[46 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({
                            text: 'როდის ჩაუტარდა სადარბაზოებს კაპიტალური რემონტი: ' + row[47 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({text: 'კომენტარი: ' + row[48 + (i - 1) * 21], style: 'small'});
                        var h6 = {text: 'შახტები', style: 'header'};
                        arr.push({text: 'გამოუყენებელი ლიფტის შახტები: ' + row[49 + (i - 1) * 21], style: 'small'});
                        arr.push({
                            text: 'გამოუყენებელი ლიფტის შახტის სტატუსი: ' + row[50 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({text: 'საჰაერო შახტების რაოდენობა: ' + row[51 + (i - 1) * 21], style: 'small'});
                        arr.push({
                            text: 'ფუნქციონირებს თუ არა საჰაერო შახტები: ' + row[52 + (i - 1) * 21],
                            style: 'small'
                        });
                        arr.push({text: 'შიდა საკვამური: ' + row[53 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'გარე საკვამური: ' + row[54 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'გარე საკვამურების რაოდენობა: ' + row[55 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'სანაგვე შახტა: ' + row[56 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'სანაგვე შახტის სტატუსი: ' + row[57 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'სანაგვე ბუნკერი: ' + row[58 + (i - 1) * 21], style: 'small'});
                        arr.push({text: 'კომენტარი: ' + row[59 + (i - 1) * 21], style: 'small'});
                    }
                    for (var i = 1; i <= 12; i++) {
                        arr.push({text: 'ლიფტი N' + i, style: 'header'});
                        arr.push({
                            canvas: [{
                                type: 'line',
                                x1: 0,
                                y1: 0,
                                x2: 600 - 2 * 40,
                                y2: 0,
                                lineWidth: 3,
                                color: 'grey'
                            }]
                        });
                        arr.push({
                            text: 'ლიფტის მდებარეობა: ' + row[165 + (i - 1) * 8],
                            style: 'small',
                            margin: [0, 20, 0, 0]
                        });
                        arr.push({text: 'ლიფტის სახეობა: ' + row[166 + (i - 1) * 8], style: 'small'});
                        arr.push({text: 'ლიფტის ვიზუალური მდგომარეობა: ' + row[167 + (i - 1) * 8], style: 'small'});
                        arr.push({
                            text: 'არსებობს თუ არა ლიფტის ტექ. პასპორტი: ' + row[168 + (i - 1) * 8],
                            style: 'small'
                        });
                        arr.push({text: 'ფასიანია თუ არა ლიფტი: ' + row[169 + (i - 1) * 8], style: 'small'});
                        arr.push({
                            text: 'ლიფტის ინტერიერის კომერციული სტატუსი: ' + row[170 + (i - 1) * 8],
                            style: 'small'
                        });
                        arr.push({
                            text: 'ლიფტის კაპიტალური რემონტის ჩატარების ბოლო თარიღი: ' + row[171 + (i - 1) * 8],
                            style: 'small'
                        });
                        arr.push({text: 'კომენტარი: ' + row[172 + (i - 1) * 8], style: 'small'});
                    }
                    var h7 = {text: 'ეზო', style: 'header'};
                    arr.push(h7);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'ეზოს საერთო ფართობი: ' + row[261] + ' პრივატიზებული ფართობი: ' + row[262],
                        style: 'small', margin: [0, 20, 0, 0]
                    });
                    arr.push({text: 'როდის გამოიცვალა ასფალტის საფარი ეზოში: ' + row[263], style: 'small'});
                    arr.push({
                        text: 'საერთო სარგებლობის ჭიშკარი/შლაგბაუმი: ' + row[264] + ' რაოდენობა: ' + row[265],
                        style: 'small'
                    });
                    var h8 = {text: 'ჭიშკრის/შლაგბაუმის გაღება', style: 'header'};
                    arr.push(h8);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({text: 'I ჭიშკარი/შლაგბაუმი: ' + row[265], style: 'small', margin: [0, 20, 0, 0]});
                    arr.push({text: 'II ჭიშკარი/შლაგბაუმი: ' + row[266], style: 'small'});
                    arr.push({text: 'III ჭიშკარი/შლაგბაუმი: ' + row[267], style: 'small'});
                    arr.push({text: 'IV ჭიშკარი/შლაგბაუმი: ' + row[268], style: 'small'});
                    var h9 = {text: 'წითელ ხაზებში მოქცეული ინფრასტრუქტურა', style: 'header', margin: [0, 30, 0, 0]};
                    arr.push(h9);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'სპორტული მოედნები: ' + row[268] + ' მდგომარეობის სტატუსი: ' + row[269],
                        style: 'small', margin: [0, 20, 0, 0]
                    });
                    arr.push({
                        text: 'საბავშვო სკვერი: ' + row[270] + ' მდგომარეობის სტატუსი: ' + row[271],
                        style: 'small'
                    });
                    arr.push({text: 'გამწვანების ზონები: ' + row[272], style: 'small'});
                    arr.push({text: 'გამწვანების ზონის ტიპი: ' + row[273], style: 'small'});
                    arr.push({text: 'დამხმარე შენობა-ნაგებობები: ' + row[274], style: 'small'});
                    arr.push({text: 'საერთო სარგებლობის ონკანი: ' + row[275], style: 'small'});
                    arr.push({text: 'საერთო სარგებლობის სველი წერტილები: ' + row[276], style: 'small'});
                    var h10 = {text: 'ავტოფარეხები და ავტოსადგომები', style: 'header'};
                    arr.push(h10);
                    arr.push({
                        canvas: [{
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600 - 2 * 40,
                            y2: 0,
                            lineWidth: 3,
                            color: 'grey'
                        }]
                    });
                    arr.push({
                        text: 'გადახურული მიწისზედა ავტოფარეხების რაოდენობა: ' + row[277],
                        style: 'small',
                        margin: [0, 20, 0, 0]
                    });
                    arr.push({text: 'ღია ტიპის მიწისზედა ავტოსადგომების რაოდენობა: ' + row[278], style: 'small'});
                    arr.push({text: 'ღია ტიპის მიწისქვეშა ავტოფარეხების რაოდენობა: ' + row[279], style: 'small'});
                    arr.push({text: 'დახურული ტიპის მიწისქვეშა ავტოსადგომების რაოდენობა: ' + row[280], style: 'small'});
                }
            }

            var docDefinition = {
                footer: function (currentPage, pageCount) {
                        return [
                            {
                                text: currentPage.toString() + ' - ' + pageCount,
                                fontSize: 10,
                                alignment: 'center',
                                margin: [0, 5, 0, 0]
                            }
                        ]
                },
                pageOrientation: 'portrait',
                content: [
                    {
                        stack: arr
                    }
                ],
                styles: {
                    small: {
                        fontSize: 8
                    },
                    header: {
                        font: 'GeoMtavruli',
                        fontSize: 10,
                        alignment: 'left',
                        margin: [0, 20, 0, 0],
                        bold: false,
                        pageBreak: 'after'
                    }
                }
            };

            var pdfDoc = printer.createPdfKitDocument(docDefinition);
            res.header('content-disposition', 'attachment;');
            pdfDoc.pipe(res);
            pdfDoc.end();


        });
    }
});
module.exports = router;
