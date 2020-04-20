var WP = require('./WP_Global.js');
const colors = require('colors');
var rcv_buf = new Uint8Array(64);
var rcvcnt=0;
var CONFIG = WP.CONFIG;
var rcvtimeout = null;
const SerialPort = require('serialport');

module.exports = {
    _ScanPort: async function(){
        //--- Show all available comnport port ---------------
        if (WP.ComPortPresent == null) {
            console.log("Scan Comport...".white.bgBlue);
            var portnum = 0;
            await SerialPort.list().then(
                ports => ports.forEach(async function(port) {
                    const str = port.path + ' (' + port.manufacturer + ':pid='+ port.productId+ 'vid='+ port.vendorId + ')';
                    console.log(str.white.bgBlue);
                    portnum++;
                    WP.deviceMap.set(portnum, port.path);
                    if (port.path == CONFIG.comport) {
                        WP.ComPortPresent = port.path;
                    }
                }),
                err => console.log(err),
            );
        }
    },

    _OpenPort: function(){
        if (WP.ComPortPresent != null) {
            WP.Device_Port = new SerialPort(CONFIG.comport, {
                autoOpen: false,
                baudRate: CONFIG.baudrate,
                dataBits: CONFIG.datalen,
                parity: CONFIG.parity.toLowerCase(),
                hupcl: true,
                highWaterMark: 256,
                xon: false,
                xoff: false,
                rtscts: true
            });           

            WP.Device_Port.open(function(err) {
                if (err) {
                    console.log(err);
                }
                clearImmediate(WP.scanalarm);
                WP.ComIsOpen = true;
            });

            WP.Device_Port.on('open', function(err) {
                if (err) {
                    console.log(err.message);
                }
                else {
                    const str = 'Open Serial port :' + WP.Device_Port.path;
                    console.log(str.black.bgGreen);
                }
                WP.SocketSent('comstatus', {step: "1",id: CONFIG.DEVICE_ID});
            });
    
            WP.Device_Port.on('close', function() {
                console.log('Device_Port port close'.white.bgRed);
                WP.ComIsOpen = false;
                WP.token=null;
                WP.SocketSent('comstatus', {status: "3",id: CONFIG.DEVICE_ID});
            });
    
            WP.Device_Port.on('error', (err) => {
                console.log("comport error!!! " + err);
                process.exit(1);
            });
    
            WP.Device_Port.on('data', function(buffer) {
                for (var i = 0; i < buffer.length; i++) {
                    rcv_buf[rcvcnt] = buffer.readInt8(i);
                    clearTimeout(rcvtimeout);
                    rcvtimeout = setTimeout(evnTimeout, 50); //100ms timeout
                    parser_datain();
                }
            });
            WP.Device_Port.on('drain', () => {});
        }
    },

    _PortWrite: function(buf){
        var msg='';
        if (WP.ComIsOpen == false) {
            console.log("comport not open".white.bgRed);
            msg = 'ComPort not open';
        } else {
            WP.Device_Port.write(buf, function(err) {
                if (err) {
                    msg = 'Error write Device_Port: ' + err ;
                    console.log(msg);
                    return msg;
                }
                //-----------------------------------------------
                // we can output the command buffer to the customer for development purpose
                //-----------------------------------------------
                if( process.env.ENGINEERING_MOD == "ON"){
                    // console.log(Buffer.from(buf).toString('hex'));
                    //---- or use the follow formate to conver to Hex string -----
                    // console.log(buf.toString('ascii',0,buf.length));
                    if( typeof buf !="string"){
                        var str='';
                        buf.forEach( function(data){
                            if(data == 0 || data == null)
                                str +='00,';
                            else
                                // str += padding1(data.toString(16),2) + ',' ;
                                str += data.toString(16).padStart(2, "0")+ ',';
                        })
                        console.log(str);
                        // WP.ShowMsg(str);
                    }
                    else{
                        var str=''; 
                        var hex;
                        for (var n = 0; n < buf.length; n++) { 
                            hex = Number(buf.charCodeAt(n)).toString(16); 
                            str +=hex+',';
                        } 
                        console.log(str);
                        // WP.ShowMsg(str);
                    }    
                }
                // WP.SocketSent('done',msg );
            });
        }
        return msg; 
    }
}
function padding1(num, length) {
    for(var len = (num + "").length; len < length; len = num.length) {
        num = "0" + num;            
    }
    return num;
}
function padding4(num, length) {
    //这里用slice和substr均可
    return (Array(length).join("0") + num).slice(-length);
}
function evnTimeout() {
    WP.FrameTimeout = true;
    console.log("Frame timeout");
    rcvcnt = 0;
    rcv_buf.fill(0);
    clearImmediate();
    WP.RcvState = WP.STATE_IDLE;
    WP.SocketSent('NAK' );
}

function parser_datain() {
    var msg;
    var start;
    var end;
    var result

    if ((WP.RcvState == WP.STATE_DOWNLOADFONT) && (rcv_buf[rcvcnt] == 0x0a)) {
        if (rcv_buf[0] == 79 && rcv_buf[1] == 75) { //'OK'
            rcvok = true;
            WP.SocketSent('ACK',{id: CONFIG.DEVICE_ID} );
        } else if (rcv_buf[0] == 78 && rcv_buf[1] == 71) { //'NG'
            FONT_update_process = false;
            msg = 'Download Fail !!!'
            WP.SocketSent('done',{p1:msg, id:CONFIG.DEVICE_ID} );
            console.log("download Fail");
        }
    } else if (rcv_buf[rcvcnt] == 0) {
        switch (WP.RcvState) {
            case WP.STATE_GETBAUDRATE:
                msg = Buffer.from(rcv_buf);
                WP.ShowMsg(msg.toString());
                WP.SocketSent('done', {p1:msg.toString(), id:CONFIG.DEVICE_ID});
                break;
            case WP.STATE_GETCMDTYPE:
                msg = Buffer.from(rcv_buf);
                //ShowMsg(msg.toString());
                WP.SocketSent('done', {p1:msg.toString(), id:CONFIG.DEVICE_ID});
                break;
            case WP.STATE_GETCHARSET:
                msg = Buffer.from(rcv_buf);
                //ShowMsg(msg.toString());
                WP.SocketSent('done', {p1:msg.toString(), id:CONFIG.DEVICE_ID});
                break;
            case WP.STATE_GETCODEPAGE:
                msg = Buffer.from(rcv_buf);
                //ShowMsg(msg.toString());
                WP.SocketSent('done', {p1:msg.toString(), id:CONFIG.DEVICE_ID});
                break;
            case WP.STATE_GETFIRMWARE:
                msg = Buffer.from(rcv_buf);
                //ShowMsg(msg.toString());
                WP.SocketSent('done', {p1:msg.toString(), id:CONFIG.DEVICE_ID});
                break;
            case WP.STATE_READ_BOOT:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                msg = result.toString('ascii', 0, result.length);
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'Boot Version : ' + msg, id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            case WP.STATE_READ_FW:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                msg = result.toString('ascii', 0, result.length);
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'FW Version : ' + msg, id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            case WP.STATE_READ_MANUFACTURE:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                msg = result.toString('ascii', 0, result.length);
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'Manufacture : ' + msg,id:CONFIG.DEVICE_ID});
                WP.SocketSent('rcvmf', {p1:msg,id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            case WP.STATE_READ_MODELNAME:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                msg = result.toString('ascii', 0, result.length);
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'ModelName : ' + msg,id:CONFIG.DEVICE_ID});
                WP.SocketSent('rcvpname', {p1:msg,id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            case WP.STATE_READ_SERIAL:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                msg = result.toString('ascii', 0, result.length);
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'Read Serial Number : ' + msg, id:CONFIG.DEVICE_ID});
                WP.SocketSent('rcvserial', {p1:msg,id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            case WP.STATE_READ_FONTCODE:
                start = rcv_buf.indexOf(0x1f);
                end = rcv_buf.indexOf(0);
                result = Buffer.from(rcv_buf.slice(start + 1, end));
                WP.Font_code = result.toString('ascii', 0, result.length);
                msg = WP.Font_code;
                //ShowMsg(msg);
                WP.SocketSent('done', {p1:'Font Code : ' + msg, id:CONFIG.DEVICE_ID});
                // WP.SocketSent('rcvserial', {p1:msg,id:CONFIG.DEVICE_ID});
                WP.resMsg = msg;
                break;
            default:
                // WP.ShowMsg('recev state(' + WP.RcvState + ')');
                break;
        }
    } else {
        rcvcnt++;
        return;
    }
    //--- Reset receive timer & clead receive buffer -----------
    rcvcnt = 0;
    rcv_buf.fill(0);
    clearImmediate();
    clearTimeout(rcvtimeout);
    WP.RcvState = WP.STATE_IDLE;
    WP.FrameTimeout = false;
}
//---USBCDC Serial Port function ----------------------------
// /** https://serialport.io/docs/api-stream
//  * @typedef {Object} openOptions
//  * @property {boolean} [autoOpen=true] Automatically opens the port on `nextTick`.
//  * @property {number=} [baudRate=9600] The baud rate of the port to be opened. 
//       This should match one of the commonly available baud rates, such as 110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, or 115200. 
//  * @property {number} [dataBits=8] Must be one of these: 8, 7, 6, or 5.
//  * @property {number} [highWaterMark=65536] The size of the read and write buffers defaults to 64k.
//  * @property {boolean} [lock=true] Prevent other processes from opening the port. Windows does not currently support `false`.
//  * @property {number} [stopBits=1] Must be one of these: 1 or 2.
//  * @property {string} [parity=none] Must be one of these: 'none', 'even', 'mark', 'odd', 'space'.
//  * @property {boolean} [rtscts=false] flow control setting
//  * @property {boolean} [xon=false] flow control setting
//  * @property {boolean} [xoff=false] flow control setting
//  * @property {boolean} [xany=false] flow control setting
//  */
// /**  setOptions
//  * {Boolean} [setOptions.brk=false] sets the brk flag
//  * {Boolean} [setOptions.cts=false] sets the cts flag
//  * {Boolean} [setOptions.dsr=false] sets the dsr flag
//  * {Boolean} [setOptions.dtr=true] sets the dtr flag
//  * {Boolean} [setOptions.rts=true] sets the rts flag
//  */
// Returns the control flags (CTS, DSR, DCD) on the open port. 
// /*
//---------------------------------------