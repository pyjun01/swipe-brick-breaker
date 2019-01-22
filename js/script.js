let FPS= 60;
let turn= 1;
const canvas= document.getElementById("canvas");
const ctx= canvas.getContext('2d');
let W= canvas.width;
let H= canvas.height;
ctx.setLineDash([5, 5]);
ctx.strokeStyle= "#A5DDF9";
ctx.lineCap= 'round';
ctx.lineWidth= 2;

let Move_cnt= 0;
let tx=0; // 공이 닿을 x 좌표값
let ty= 0; // 공이 닿을 y 좌표값
let down= false;
let shot= false;
function Checkdistance(x1, y1, x2, y2){
	let x= Math.abs(x1-x2);
	let y= Math.abs(y1-y2);
	let result= Math.sqrt(x*x+y*y);

	return 10 >= result;
}
function clear (){ctx.clearRect(0,0,canvas.width,canvas.height);}
function ball(x, y){
	this.path= new Path2D();
	this.radius= 10;
	this.x= x? x: W / 2;
	this.y= y? y: H-10;
	this.direction= [0, 0];
	this.draw= (c= "#4BBCF4", x= this.x, y= this.y) =>{
		this.path= new Path2D();
		ctx.fillStyle= c;
		this.path.arc(x, y, this.radius, 0, 2*Math.PI, false);
		ctx.fill(this.path);
	}
}
ball.prototype.GetPath= function GetPath (lx, ly, re){ // get path
	var n= "1";
	for(var i=0; i<String(Math.max(Math.abs(lx), Math.abs(ly))).split(".")[0].length-1; i++)
		n+= "0";
	lx= lx/Number(n);
	ly= ly/Number(n);
	console.log(lx);
	while(  (ly<3 || ly>3.5) ){
		if(Math.abs(lx)>4)
			break;
		lx= lx+ (ly<3? lx*0.05: -lx*0.05)
		ly= ly+ (ly<3? ly*0.05: -ly*0.05)
	}
	this.direction= [lx, ly];
	var ax= this.x;
	var ay= this.y;
	var over= false;
	while( (ax+this.radius<=canvas.width || ax>=0) || (ay+this.radius<=canvas.height || ay>=0) ){
		ax+= lx;
		ay-= ly;
		if(ax+this.radius>=canvas.width || ax<=this.radius){
			ax= ax+this.radius>=canvas.width? canvas.width-this.radius: this.radius;
			lx*= -1;
			over= true;
		}
		if(ay+this.radius>=canvas.height || ay<=this.radius){
			ay= ay+this.radius>=canvas.height? canvas.height-this.radius: this.radius;
			ly*= -1;
			over= true;
		}
		var B= false;
		for(var i=0, len= blocks.length; i<len; i++){
			let b= blocks[i];
			let pointX= getPoint(ax, b.X_min, b.X_max);
			let pointY= getPoint(ay, b.Y_min, b.Y_max);
			if(Checkdistance(ax, ay, pointX, pointY)){
				if(pointX == b.X_max){
					ax= b.X_max+10;
				}else if(pointX == b.X_min){
					ax= b.X_min-10;
				}
				if(pointY == b.Y_max){
					ay= b.Y_max+10;
				}else if(pointY == b.Y_min){
					ay= b.Y_min-10;
				}
				B= true;
				break;
			}
		}
		if(over || B){
			break;	
		} 
	}
	tx= ax;
	ty= ay;
	Move_cnt++;
	DrawPath= true;
}
function getPoint(v, min, max){
	if(v <= min)
		return min
	else if(v >= max)
		return max
	else
		return v;
}
ball.prototype.DrawPath= function DrawPath(c){ // line animation & ball draw
	if( !down || Move_cnt != c) // 방향이 다르거나 마우스클릭이 안돼있으면 return
		return;
	clear();
	ctx.beginPath();
	ctx.moveTo(this.x, this.y);
	ctx.lineTo(tx, ty);
	ctx.stroke();
	ctx.closePath();
	ctx.lineDashOffset-= 0.7;
	this.draw("#7cd3ff", tx, ty);
	this.draw();

	for(var i=0; i< blocks.length; i++){
		blocks[i].draw();
	}
}
let DrawPath= false;
ball.prototype.Shoot= function (){
	clear();
	this.x+= this.direction[0]*2;
	this.y-= this.direction[1]*2;
	if(this.x+this.radius>=canvas.width || this.x<=this.radius){
		this.x= this.x+this.radius>=canvas.width? canvas.width-this.radius: this.radius;
		this.direction[0]= this.direction[0]*-1;
	}
	if(this.y+this.radius>=canvas.height || this.y<=this.radius){
		this.y= this.y+this.radius>=canvas.height? canvas.height-this.radius: this.radius;
		this.direction[1]= this.direction[1]*-1;
	}
	for(var i=0, len= blocks.length; i<len; i++){
		if(blocks[i] == undefined)
			continue;
		let b= blocks[i];
		let pointX= getPoint(this.x, b.X_min, b.X_max);
		let pointY= getPoint(this.y, b.Y_min, b.Y_max);
		if(Checkdistance(this.x, this.y, pointX, pointY)){
			console.log("닿음");
			console.log(pointX, pointY);
			if( b.X_min < pointX && pointX < b.X_max){
					this.direction[1]*=-1;
			}
			if( b.Y_min < pointY && pointY < b.Y_max){
					this.direction[0]*=-1;
			}

			b.cnt--;
			if(b.cnt<=0)
				blocks.splice(i, 1)
		}else{
			// 그냥감
		}
	}
	for(var i=0, len= blocks.length; i<len; i++)
		blocks[i].draw();
	this.draw("#7cd3ff", this.x, this.y);
	if(this.y+this.radius>=canvas.height){
		this.draw();
		shot = false;
		updateBlock();
		return;
	}
	var self= this;
	setTimeout(_ =>{
		self.Shoot();
	}, 1000 / FPS);
}
function display(){
	clear();
	Ball.draw();
	for(var i=0, len= blocks.length; i<len; i++)
		if(blocks[i] != undefined)
			blocks[i].draw();
	if(DrawPath){
		Ball.DrawPath(Move_cnt);
	}
	requestAnimationFrame(function (){
		display();
	})
}
function updateBlock(){
	for(var i=0, len= blocks.length; i<len; i++){
		blocks[i].t++;
		if(blocks[i].t==8)
			end();
	}
	blocks.push(new Block({l: Math.floor(Math.random()*6), t: 0, cnt: turn}));
}
const C= ["#91a7ff", "#748ffc", "#5c7cfa", "#4c6ef5", "#4263eb", "#3b5bdb", "#364fc7"];
function Block (option){
	this.w= W/6;
	this.h= H/9;
	this.l= option.l;
	this.t= option.t;

	this.X_min= this.l*this.w+1;
	this.Y_min= this.t*this.h+1;
	this.X_max= this.X_min+this.w-2;
	this.Y_max= this.Y_min+this.h-2;

	this.cnt= option.cnt;
	this.c= C[Math.floor(option.cnt/10)>=6? 6: Math.floor(option.cnt/10)];
}
Block.prototype.draw = function (){
	ctx.save();
	ctx.fillStyle= this.c;
	ctx.fillRect(this.l*this.w+1, this.t*this.h+1, this.w-2, this.h-2);
	ctx.fillStyle= "#000";
	ctx.font = "20px sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(this.cnt, this.l*this.w+1+(this.w-2)/2, this.t*this.h+1+(this.h-2)/2+6); 
	ctx.restore();
};

let Ball= new ball();
let blocks= [];

window.onload= function (){
	blocks.push(new Block({l: 0, t: 0, cnt: turn}));
	blocks.push(new Block({l: 1, t: 0, cnt: turn}));

	canvas.addEventListener("mousedown", function (e){
		if(shot)
			return;
		var cx= e.pageX-canvas.offsetLeft;
		var cy= e.pageY-canvas.offsetTop;
		if(!ctx.isPointInPath(Ball.path, cx, cy)){
			down= true;
			Ball.GetPath( (cx-Ball.x), -(cy-Ball.y), 0);
		}
	});
	window.addEventListener("mousemove", function (e){
		if(down){
			var mx= e.pageX-canvas.offsetLeft;
			var my= e.pageY-canvas.offsetTop;
			if(ctx.isPointInPath(Ball.path, mx, my)){
				Move_cnt++;
				clear();
				Ball.draw();
			}else{
				Ball.GetPath( (mx-Ball.x), -(my-Ball.y), 0);
			}
		}
	});
	window.addEventListener("mouseup", function (e){
		if(down){
			down= false;
			shot= true;
			DrawPath= false;
			ctx.lineDashOffset= 0;
			Ball.Shoot();
			turn++;
			// update
		}
	});
	for(var i=0, len= document.querySelectorAll("input[type='radio']").length; i<len; i++){
		document.querySelectorAll("input[type='radio']")[i].onclick= function (){
			FPS= this.value*60
		}
	}
	display();
}
	
// function DrawLinePoint(x, y, angle, length){
// const radians = (Math.PI / 180.0) * angle;
// ctx.beginPath();
// ctx.moveTo(100, 100);
// ctx.lineTo(x + Math.cos(radians)*length, y + Math.sin(radians)*length);
// ctx.stroke();
// ctx.closePath();
// /*
// (r*r)= (x*x) + (y*y)
// tan(θ)= y / x
// θ = atan(y / x)
// */
// }