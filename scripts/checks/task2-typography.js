// 排版二期：Hero 渐变大字（每字渐变）+ 视图大标题海报字
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var nameEl = document.querySelector('.hero .name');
__result(nameEl && parseFloat(getComputedStyle(nameEl).fontSize) >= 40, 'hero name font >= 2.6rem, got ' + (nameEl ? getComputedStyle(nameEl).fontSize : 'none'));

var nameChars = document.querySelectorAll('.hero .name .char');
__result(nameChars.length === 2, 'name split into 2 chars, got ' + nameChars.length);
if (nameChars.length) {
  var cs = getComputedStyle(nameChars[0]);
  __result(cs.backgroundImage.indexOf('linear-gradient') >= 0, 'char has vertical gradient, got ' + cs.backgroundImage);
  __result(cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)', 'char text fill transparent, got ' + cs.webkitTextFillColor);
}

var greetChars = document.querySelectorAll('#typeTarget .char');
__result(greetChars.length === 27, 'greeting split into 27 chars, got ' + greetChars.length);

var titles = document.querySelectorAll('.section-title');
__result(titles.length === 7, '7 section titles, got ' + titles.length);
var tEls = document.querySelectorAll('.section-title .t');
__result(tEls.length === 7, 'every title wrapped in .t span, got ' + tEls.length);
if (tEls.length) {
  var ts = getComputedStyle(tEls[0]);
  __result(ts.backgroundImage.indexOf('linear-gradient') >= 0, 'section title has gradient, got ' + ts.backgroundImage);
  __result(parseFloat(getComputedStyle(document.querySelector('.section-title')).fontSize) >= 16, 'section title enlarged (>= 1rem), got ' + getComputedStyle(document.querySelector('.section-title')).fontSize);
}
