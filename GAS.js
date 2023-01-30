var CHANNEL_ACCESS_TOKEN = 'gDWVH9gTmZ5USRTmRNPO0cYK0wZfqb85ZNYnh3Xl7HKr097PmgM6Mcfxk/cd3brbjfVliGtaXQX0VeMb9RcUuvhDm0GuJLGfvUatz1++g3ksTkwxCFQimTnDdM9xgT2r4hncGCsIRp41897ST2tAAQdB04t89/1O/w1cDnyilFU='; 
var line_endpoint = 'https://api.line.me/v2/bot/message/reply';

//ポストで送られてくるので、ポストデータ取得
function doPost(e) {
  //JSONをパースする
  var json = JSON.parse(e.postData.contents);

  //返信するためのトークン取得
  var reply_token= json.events[0].replyToken;
  if (typeof reply_token === 'undefined') {
    return;
  }

  //送られたLINEメッセージを取得
  var user_message = json.events[0].message.text;  

  // シート名を指定してsheetとして持っておきます
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('新橋');

  var target_rows
  var address
  var messages
  
  if(user_message == 'おまかせ'){
    // 「おまかせ」というメッセージが送られた場合は、シートの3列目の「おすすめ度」で検索を行います
    // searchDataByScoreという関数を作り、69点より上の点数のお店を検索します
    target_rows = searchDataByScore(sheet, 69, 6);
    target_rows = randomSelect(target_rows) // 検索結果からランダムに1つを選択する関数を作って呼び出します

    // シートからお店の住所の情報を取り出します
    address = sheet.getRange(target_rows[0],5).getValue()
    // 住所がなかったらお店の名前だけ表示します
    if(!address){
      messages = [{'type': 'text', 'text': "店名：" + sheet.getRange(target_rows[0],1).getValue()}];
    } else {
      // 住所から緯度軽度を計算します
      var
        geocoder = Maps.newGeocoder() // Creates a new Geocoder object.
        , geocoder = geocoder.setLanguage('ja') // Use Japanese
        , response = geocoder.geocode(address).results[0]; // ets the approximate geographic points for a given address.
      // ユーザーに返すメッセージを組み立てます
      messages = [{
          "type": "location",
          "title": sheet.getRange(target_rows[0],1).getValue(),
          "address": address,
          "latitude": response.geometry.location.lat,
          "longitude": response.geometry.location.lng
        }];
    }    
  }else{
    target_rows = searchData(sheet, user_message, 2); // 2列目は「ジャンル」
    target_rows = randomSelect(target_rows) // ランダムに一つを選択
    
    address = sheet.getRange(target_rows[0],5).getValue()
    if(!address){
      messages = [{'type': 'text', 'text': "店名：" + sheet.getRange(target_rows[0],1).getValue()}];
    } else {
      var
        geocoder = Maps.newGeocoder() // Creates a new Geocoder object.
        , geocoder = geocoder.setLanguage('ja') // Use Japanese
        , response = geocoder.geocode(address).results[0]; // ets the approximate geographic points for a given address.

      messages = [{
          "type": "location",
          "title": sheet.getRange(target_rows[0],1).getValue(),
          "address": address,
          "latitude": response.geometry.location.lat,
          "longitude": response.geometry.location.lng
        }];
    }
  }
    
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': messages,
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

// 文字でお店を検索します
function searchData(sheet, val, col){
  var dat = sheet.getDataRange().getValues();
  var target_rows = []; 
  for(var i = 1; i < dat.length; i++) {
    if(dat[i][col-1].indexOf(val) != -1){
      target_rows.push(i+1);
    }
  }
  return target_rows;
}

// 点数でお店を検索します
function searchDataByScore(sheet, score, col){
  var dat = sheet.getDataRange().getValues();
  var target_rows = []; 
  for(var i = 1; i < dat.length; i++) {
    if(dat[i][col-1] > score){
      target_rows.push(i+1);
    }
  }
  return target_rows;
}

function randomSelect(array){
  var randomSelect = [];
  while(randomSelect.length < 1 && array.length > 0){
    const rand = Math.floor(Math.random() * array.length);
    randomSelect.push(array[rand]);
    array.slice(rand, 1); // 結果が重複しないように、元の配列からは削除
  }
  return randomSelect;
}