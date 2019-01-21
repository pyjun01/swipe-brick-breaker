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
function clear (){ctx.clearRect(0,0,canvas.width,canvas.height);}
function ball(x, y){
	this.path= new Path2D();
	this.radius= 10;
	this.x= x? x: canvas.width / 2;
	this.y= y? y: canvas.height-10;
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
	while(  (ly<3 || ly>3.5) && (Math.abs(ly)<3 || Math.abs(ly)>3.5)){
		lx= lx+ (ly<3? lx*0.05: -lx*0.05)
		ly= ly+ (ly<3? ly*0.05: -ly*0.05)
	}
	this.direction= [lx, ly];
	var ax= this.x;
	var ay= this.y;
	var over= false;
	console.log(lx, ly);
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
			let X_min= b.l*b.w;
			let X_max= X_min+b.w;
			let Y_min= b.t*b.h;
			let Y_max= Y_min+b.h;
			if(X_min <= ax+this.radius && ax-this.radius <= X_max && Y_min <= ay+this.radius && ay-this.radius <= Y_max){
				B= true;
				break;
			}
		}
		if(over || B) break;
	}
	tx= ax;
	ty= ay;
	Move_cnt++;
	this.DrawPath(Move_cnt);
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
	var self= this;
	setTimeout(_ =>{
		if( !down || Move_cnt != c)
			return;
		self.DrawPath(c);
	}, 1000 / FPS);
}
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
		let X_min= b.l*b.w;
		let X_max= X_min+b.w;
		let Y_min= b.t*b.h;
		let Y_max= Y_min+b.h+this.radius;

		if(X_min <= this.x-this.radius && this.x+this.radius <= X_max && Y_min <= this.y+this.radius && this.y-this.radius <= Y_max){
			this.y= Math.abs(Y_min-this.y+this.radius) < Math.abs(Y_max-this.y-this.radius)? Y_min: Y_max;
			this.direction[1]= this.direction[1]*-1;
			b.cnt--;
			if(b.cnt<=0)
				blocks.splice(i, 1)
		}else if(Y_min <= this.y+this.radius && this.y-this.radius <= Y_max && X_min <= this.x+this.radius && this.x-this.radius <= X_max){
			this.x= Math.abs(X_min-this.x+this.radius) < Math.abs(X_max-this.x-this.radius)? X_min: X_max;
			this.direction[0]= this.direction[0]*-1;
			b.cnt--;
			if(b.cnt<=0)
				blocks.splice(i, 1)
		}

		// if(
		// 	Y_min <= this.y+this.radius && this.y+this.radius <= Y_max && X_min <= this.x+this.radius){
		// 	this.x= X_min;
		// 	this.direction[0]= this.direction[0]*-1;
		// 	b.cnt--;
		// 	if(b.cnt<=0){
		// 		blocks.splice(i, 1)
		// 	}
		// }
	}
	for(var i=0, len= blocks.length; i<len; i++)
		blocks[i].draw();
	this.draw("#7cd3ff", this.x, this.y);
	if(this.y+this.radius>=canvas.height){
		this.draw();
		shot = false;
		return;
	}
	var self= this;
	setTimeout(_ =>{
		self.Shoot();
	}, 1000 / FPS);
}
let blocks= [];
const C= ["#91a7ff", "#748ffc", "#5c7cfa", "#4c6ef5", "#4263eb", "#3b5bdb", "#364fc7"];
function Block (option){
	this.w= 100;
	this.h= 40;
	this.l= option.l;
	this.t= option.t;
	this.cnt= option.cnt;
	this.c= C[Math.floor(option.cnt/10)>=6? 6: Math.floor(option.cnt/10)];
}
Block.prototype.draw = function (){
	ctx.save();
	ctx.fillStyle= this.c;
	ctx.fillRect(this.l*this.w, this.t*this.h, this.w, this.h);
	ctx.fillStyle= "#000";
	ctx.font = "20px sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(this.cnt, this.l*this.w+this.w/2, this.t*this.h+this.h/2+5); 
	ctx.restore();
};
window.onload= function (){
	let Ball= new ball(570);
	blocks.push(new Block({l: 0, t: 5, cnt: 0}));
	blocks.push(new Block({l: 5, t: 5, cnt: 0}));
	// blocks.push(new Block({l: 1, t: 0, cnt: 10}));
	// blocks.push(new Block({l: 2, t: 0, cnt: 20}));
	// blocks.push(new Block({l: 3, t: 0, cnt: 30}));
	// blocks.push(new Block({l: 4, t: 0, cnt: 40}));
	// blocks.push(new Block({l: 5, t: 0, cnt: 50}));
	// blocks.push(new Block({l: 0, t: 1, cnt: 60}));
	// blocks.push(new Block({l: 1, t: 1, cnt: 70}));
	Ball.draw();
	for(var i= 0, len= blocks.length; i<len; i++)
		blocks[i].draw();

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