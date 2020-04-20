exports.STATE_IDLE = 0;
exports.STATE_GETBAUDRATE = 1;
exports.STATE_GETCMDTYPE = 2;
exports.STATE_GETFIRMWARE = 3;
exports.STATE_GETCHARSET = 4;
exports.STATE_DOWNLOADFONT = 5;
exports.STATE_READ_BOOT = 6;
exports.STATE_READ_FW = 7;
exports.STATE_READ_MANUFACTURE = 8;
exports.STATE_READ_MODELNAME = 9;
exports.STATE_READ_SERIAL = 10;
exports.STATE_READ_FONTCODE = 11;
exports.STATE_GETCODEPAGE = 12;
exports.RcvState=this.STATE_IDLE;

exports.configuratron = require('configuratron')
    .buildConfiguratron({ filePath: './config.json' });
exports.CONFIG = this.configuratron.getConfig();

exports.CmdType= 'ESC/POS';
exports.valid_user=null;
exports.deviceMap = new Map();
exports.ComPortPresent = null;
exports.gMacroStep = "0";
exports.token=null;
exports.ComIsOpen = false;
exports.FrameTimeout = false;
exports.resMsg = '';
exports.Device_Port = null;
exports.SerialPort = require('serialport');
exports.scanalarm = null;
exports.BROWSER_URL = 'http://'+ this.CONFIG.SERVER_URL +':' + this.CONFIG.Browser_port;
exports.IF_URL = 'http://'+ this.CONFIG.SERVER_URL +':' + this.CONFIG.IF_port;
exports.socket = require('socket.io-client')(this.IF_URL);
exports.USB_CDC= require('./Usb_CDC.js');
exports._delay = function (ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
exports.CheckExpire = function(token){
    //--- check current token is within valid time ?
    const jwt = require('jsonwebtoken');
    try{ 
        const nowTokenTime = jwt.verify(
            token,
            process.env.TOKEN_SECRET,
            {maxAge: WP.ExpireTime}
        );
        return nowTokenTime; 
    }catch(e)
    {
        ShowMsg(e);
        return null;
    }
}
exports.CheckToken= async function(token) {
    //--- Check need login  ?? 
    const jwt = require('jsonwebtoken');
    if (process.env.LOGIN_CHECK.toUpperCase() != "ENABLE") 
        return EngineeringID;
    else {
        if (token == null) return null;
    }
    try {
        //-- you candecode the token here -----
        // const decoded = jwt.decode(token);
        // console.log(decoded);
        //--- verify jwt with secrete & expire time ---
        const nowtoken = jwt.verify(
            token,
            process.env.TOKEN_SECRET,
        );
        return nowtoken;
    } catch (err) {
        this.ShowMsg('Token Error: ' + err);
        valid_user = null;
        return null;
    }
}
exports.SocketSent= function(cmd,msg){
    this.socket.emit(cmd,msg);
}
exports.getSocketID = function(){
    return this.socket.id;
}
exports.WriteStream= function(arr){
    const USB_CDC= require('./Usb_CDC.js');
    var msg = USB_CDC._PortWrite(arr[0]);
    if( msg ==  '') {
        msg = arr[1];
    }
    return msg;
}
exports.PortWrite= function(buf){
    const USB_CDC= require('./Usb_CDC.js');
    var msg = USB_CDC._PortWrite(buf);
}
exports.ShowMsg = function(str){
    if (process.env.MSG_DEBUG == "ENABLE"){
        console.log(str);
    }
        
}
exports.ConvertTimeStamp= function(timestamp){
    //new Date(1513598707*1000)          // 因為一般 timestamp 取得的是秒數，但要帶入的是毫秒，所以要乘 1000 或者
    let date = new Date(timestamp * 1000)
    dataValues = [
    date.getFullYear(),
    date.getMonth()+1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    ];
    console.log(dataValues);
}