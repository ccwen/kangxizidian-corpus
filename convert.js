/*convert kangxizidn xml to htll format
auto insert br

~ pb
% 
^ word head
@ for link
!
#
sc to unicode u+246x (for 1~20) u++3251 (for 21~35) u+32bx(36~50) 最多39劃
zy 拉出來
&kxr ; as one character
<wh> {字-古文}  //大字
<ps> remove
<d/> add full width space before
<ph/> add 
<pb ed="twsj" id="0889"/>
<wh n="k000000" unicode="FA5B" wid="001">者</wh>（原作者）
extra  （原作者）

<wh n="k000000" unicode="24ACB" wid="021">𤫋</wh>
缺少(增)
*/
const fs=require("fs");
const Sax=require("sax");
const sourcepath="../kangxizidian/xml/";
const targetpath="out/";
var files=fs.readFileSync(sourcepath+"file.lst","utf8").split(/\r?\n/)
//files.length=1;
var notes={},filecount=0;
const preprocess=function(content){
	content=content.replace(/<d\/>/g,"㊠");
	content=content.replace(/<ph\/>/g,"㊀");
	return content;
}
const postprocess=function(content){
	content=content.replace(/\r?\n/g,"\n");
	content=content.replace(/\n\n/g,"\n");
	content=content.replace(/〔增〕/g,"㉇");
	content=content.replace(/〔註〕/g,"㊟");

	return content;
}
const wh=function(tag,closing){
	this.out+=closing?"}":"{";
}
const title=function(tag,closing){
	this.out+=closing?"}":"{";	
}
const juan=function(tag,closing){
	this.out+=closing?"}":"{　";	
}
const part=function(tag,closing){
	this.out+=closing?"}":"{　　";	
}

const zy=function(tag,closing){
	this.ignore=!closing;
}
const an=function(tag,closing){
	this.out+=closing?"}":"㉆{";
}
var filenotecount=0;
const note=function(tag,closing){
	if (closing){
		filenotecount++;
		notes[filecount+"."+filenotecount]=tag.attributes.n;
		this.out+="#"+filecount+"."+filenotecount;
	}
}
const pb=function(tag,closing){
	if (closing)return;
	if (tag.attributes.ed=="twsj"){
		this.out+="~"+parseInt(tag.attributes.id,10);
	} else {
	
	}
}
const scmarker=function(sc){
	if (sc<21) return String.fromCharCode(0x2460+sc);
	else if (sc<36) return String.fromCharCode(0x3251+(sc-21));
	else if (sc<51) return String.fromCharCode(0x32b1+(sc-36));
	else return String.fromCharCode(0x24EA); //only one 䨻
}

const sc=function(tag,closing){
	if (closing)return;

	var strokecount=parseInt(tag.attributes.n);
	if (strokecount!==this.prevsc&& strokecount!==1) {
		if (this.out[this.out.length-2]=="}") {
			at=this.out.lastIndexOf("{");
			const len=this.out.length;
			this.out=this.out.substr(0,at)+scmarker(strokecount)+this.out.substr(at)
		} else {
			this.out+=scmarker(strokecount);
		}
	}
	this.prevsc=strokecount;
}
const processfile=function(fn){
	var content=fs.readFileSync(sourcepath+fn,'utf8');
	content=preprocess(content);
	filecount++;
	filenotecount=0;
	const parser=Sax.parser(true);
	const handlers={wh,pb,zy,an,note,sc,juan,part,title};
	var tagstack=[];
	var ctx={ignore:false,out:"",prevsc:0};

	parser.ontext=function(t){
		if (!ctx.ignore) ctx.out+=t.replace(/\r?\n/g,"\n");
	}
	parser.onopentag=function(tag){
		const handler=handlers[tag.name];
		tagstack.push(tag);
		handler && handler.call(ctx,tag);
	}
	parser.onclosetag=function(tagname){
		const tag=tagstack.pop();
		const handler=handlers[tagname];
		handler && handler.call(ctx,tag,true);
	}

	parser.write(content);
	const outputfn=targetpath+fn.replace(".xml",".txt");
	ctx.out=postprocess(ctx.out);
	console.log("writing",outputfn,ctx.out.length);
	fs.writeFileSync(outputfn,ctx.out,"utf8");
}
files.forEach(processfile);
fs.writeFileSync(targetpath+"notes.json",JSON.stringify(notes,""," "),"utf8");