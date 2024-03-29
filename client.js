
var USB_CDC= require('./js-lib/Usb_CDC.js');
var WP = require('./js-lib/WP_Global.js');
var open = require('open');
const jwt = require('jsonwebtoken');
var CONFIG = WP.CONFIG;
const dotenv = require('dotenv');
dotenv.config();
 
//----------------------------------------
async function ScanTimeout() {
    if (WP.ComPortPresent == null) {
        console.log("No comport at: " + CONFIG.comport);
    } else
        console.log("Use comport : " + CONFIG.comport);
}
//----------------------------------------
// Get Exit signal from Ctrl-C 
//----------------------------------------
process.on('SIGINT', async () => {  
    WP.SocketSent('comstatus', { step: "3",id: CONFIG.DEVICE_ID });
    try{
        if(WP.ComIsOpen == true) WP.Device_Port.close();
    }
    catch(e){
       console.log(e); 
    }
    await WP._delay(500);
    console.log("SIGINT exit Server");
    process.exit();

})
process.on('SIGTERM', async () => {
    WP.SocketSent('comstatus', { step: "3",id: CONFIG.DEVICE_ID });
    try{
        if(WP.ComIsOpen == true) WP.Device_Port.close();
    }
    catch(e){
       console.log(e); 
    }
    await WP._delay(500);
    console.log("SIGTERM exit Server");
    process.exit();
})
process.on('SIGQUIT', async () => {
    WP.SocketSent('comstatus', { step: "3",id: CONFIG.DEVICE_ID });
    try{
        if(WP.ComIsOpen == true) WP.Device_Port.close();
    }
    catch(e){
       console.log(e); 
    }
    await WP._delay(500);
    console.log("SIGQUIT exit Server");
    process.exit();
})
process.on('SIGKILL',async () => {
    WP.SocketSent('comstatus', { step: "3",id: CONFIG.DEVICE_ID });
    try{
        if(WP.ComIsOpen == true) WP.Device_Port.close();
    }
    catch(e){
       console.log(e); 
    }
    await WP._delay(500);
    console.log("SIGKILL exit Server");
    process.exit();
})
 
//-----------------------------------------
//
//-----------------------------------------
WP.socket.on('connect', async function(){
    console.log('Display Client(V:%s) connect to (%s)', WP.getAppVersion(),CONFIG.SERVER_URL);
    const privatekey = process.env.TOKEN_SECRET;
    const usr_id =  CONFIG.username;
    const pwd_id = CONFIG.password;
    const usr_token = jwt.sign(usr_id,privatekey)
    const pwd_token = jwt.sign(pwd_id,privatekey)
    console.log("NewClient: user(%s) ",usr_id);
    console.log("userToken: %s",usr_token);
    console.log("pwdToken: %s ",pwd_token);
    WP.SocketSent('NewClient', {id: CONFIG.DEVICE_ID ,usr:usr_token,pwd:pwd_token});
    await open(WP.BROWSER_URL)
    
    //--- scan comport ----------------------------
    await USB_CDC._ScanPort();
    clearImmediate(WP.scanalarm);
    WP.scanalarm = setTimeout(function() { ScanTimeout(); }, 1000);
    await WP._delay(500);
    //---Send comport info to server ---------------
    if (WP.ComPortPresent != null) {
            WP.deviceMap.forEach(function(item) {
                WP.SocketSent('comadd', {
                    hid: item.toUpperCase(),
                    b: CONFIG.baudrate,
                    sel: WP.ComPortPresent,
                    dl: CONFIG.datalen, 
                    p: CONFIG.parity.toLowerCase(),
                    http: CONFIG.DEVICE_PORT,
                    id: CONFIG.DEVICE_ID
                });
            });
            var currstep ;
            if(WP.ComIsOpen == true)
                currstep= "1";
            else 
                currstep = "3";

            WP.SocketSent('comstatus', {
                step: currstep,
                id: CONFIG.DEVICE_ID
            });

    } else {
            await WP.SerialPort.list().then(
                ports => ports.forEach(async function(port) {
                    console.log(port.comName + ' (' + port.manufacturer, ':pid=', port.productId, 'vid=', port.vendorId + ')');
                    WP.SocketSent('comadd', {
                        id: port.comName.toUpperCase(),
                        b: CONFIG.baudrate,
                        sel: WP.ComPortPresent,
                        dl: CONFIG.datalen,
                        p: CONFIG.parity.toLowerCase(),
                        http: CONFIG.DEVICE_PORT,
                        id: CONFIG.DEVICE_ID
                    });
                }),
            );
    }
    //--- Send to IS server ----------------------------
    // WP.SocketSent('IFweb_start', {id: CONFIG.DEVICE_ID });
    
});

WP.socket.on('OPENPORT', function(data){
        var msg;
        var status = data.p1;
        if (WP.ComIsOpen == false && status == true) {
            USB_CDC._OpenPort();
            console.log("Opening : " + WP.ComPortPresent);
            msg =  { step: "2" ,id: CONFIG.DEVICE_ID};
        } else if (WP.ComIsOpen == true && status == false) {
            WP.Device_Port.close();
            msg = { step: "3",id: CONFIG.DEVICE_ID };
            console.log("comport already open : " + WP.ComPortPresent);
        }
        WP.SocketSent('comstatus', msg);
});
WP.socket.on('event', function(data){
        console.log('[%s]on event...', socket.id, data);
});

WP.socket.on('start', function(data){
    console.log('[%s]on start...',WP.getSocketID());
      
});
WP.socket.on('disconnect', function(){
        console.log('on disconnect....');   
});

WP.socket.on('RAW', function(data){
      var msg =WP.WriteStream(data);
      WP.SocketSent('done',msg);
});
WP.socket.on('WRT', function(data){
      // var msg = USB_CDC._PortWrite(data[0]);
      WP.PortWrite(data);
      // WP.SocketSent('ACK',msg);
});
WP.socket.on('RCVSTATE', function(data){
    //   console.log('rcv state: '+ data.msg);
    // if(WP.RcvState != WP.STATE_DOWNLOADFONT){
    //     if(data.msg ==  WP.STATE_DOWNLOADFONT){
    //         console.log("Start Downloading !!!")
    //     }
    // }
    WP.RcvState = data.msg;
});

     