const canvas= document.getElementById("canvas");
const ctx= canvas.getContext('2d');
let FPS= 60;
let turn= 1;
let W= canvas.width;
let H= canvas.height;
ctx.setLineDash([5, 5]);
ctx.strokeStyle= "#A5DDF9";
ctx.lineCap= 'round';
ctx.lineWidth= 2;
const C= ["#91a7ff", "#748ffc", "#5c7cfa", "#4c6ef5", "#4263eb", "#3b5bdb", "#364fc7"];
const Block_width= W/6;
const Block_height= H/9;
let Move_cnt= 0;
let tx=0; // 공이 닿을 x 좌표값
let ty= 0; // 공이 닿을 y 좌표값
let down= false;
let shot= false;
let mousedown= false;
let Ballcnt= 1;
let Shootcnt= 0;
let mousestate= 0; // 0= defualt 1= mousedown 2= mousemove 3= mouseup
let should_Add= 0;
let max= 0;

function ball(x, y){
	this.path= new Path2D();
	this.radius= 10;
	this.x= x? x: W / 2;
	this.y= y? y: H-10;
	this.direction= [0, 0];
	this.cnt=1;
	this.isShoot= false;
}
ball.prototype.draw = function (c= "#4BBCF4", x= this.x, y= this.y){
	this.path= new Path2D();
	ctx.save();
	// ctx.fillStyle= "rgba(0, 0, 0, 0.2)";
	// this.path.arc(x+2, y+2, this.radius, 0, 2*Math.PI, false);
	// ctx.fill(this.path);
	// this.path= new Path2D();
	ctx.fillStyle= c;
	this.path.arc(x, y, this.radius, 0, 2*Math.PI, false);
	ctx.fill(this.path);
	ctx.restore();
};
let px= 0, py= 0;
ball.prototype.GetPath= function GetPath (lx, ly, re){ // get path
	var min_range= 1;
	var max_range= 1.5;
	var n= "1";
	for(var i=0; i<String(Math.max(Math.abs(lx), Math.abs(ly))).split(".")[0].length-1; i++)
		n+= "0";
	lx= lx/Number(n);
	ly= ly/Number(n);
	while(  (ly < min_range || ly > max_range) ){
		if(Math.abs(lx)>4)
			break;
		lx= lx+ (ly<min_range? lx*0.05: -lx*0.05)
		ly= ly+ (ly<min_range? ly*0.05: -ly*0.05)
	}
	for(var i=0, len= Balls.length; i<len; i++)
		Balls[i].direction= [lx, ly];
	var ax= this.x;
	var ay= this.y;
	var over= false;
	var B= false;
	while( (ax + this.radius <= W || ax >= 0) || (ay + this.radius <= canvas.height || ay >= 0) ){
		ax+= lx;
		ay-= ly;
		if(!over){
			if(ax + this.radius >= W || ax <= this.radius){
				ax= ax + this.radius >= W?  W - this.radius: this.radius;
				lx*= -1;
				over= true;
			}
	 		if(ay + this.radius >= H || ay <= this.radius){
				ay= ay + this.radius >= H? H - this.radius: this.radius;
				ly*= -1;
				over= true;
			}
			if(over){
				px= ax;
				py= ay;
			}
		}
		if(!B){
			if(over){
				tx= ax;
				ty= ay;
				break;
			}
			for(var i=0, len= Blocks.length; i<len; i++){ // 벽에 닿았는지 체크
				let b= Blocks[i];
				let pointX= getPoint(ax, b.X_min, b.X_max);
				let pointY= getPoint(ay, b.Y_min, b.Y_max);
				if(Checkdistance(ax, ay, pointX, pointY)){
					if(pointY == b.Y_max){
						if(ax <= b.X_min){
							ay= ax <= b.X_min? ay: b.Y_max+10;
						}else if(b.X_max <= ax){
							ay= b.X_max <= ax? ay: b.Y_max+10;
						} 
						else {
							ay= b.Y_max + 10;
						}
					} else if(pointX == b.X_max){
						if(ay <= b.Y_min){
							ax= ay <= b.Y_min? ax: b.X_max + 10;
						}else if(b.Y_max <= ay){
							ax= b.Y_max <= ay? ax: b.X_max + 10;
						}else{
							ax= b.X_max + 10;
						}
					} else if(pointX == b.X_min){
						if(ay <= b.Y_min){
							ax= ay <= b.Y_min? ax: b.X_min - 10;
						}else if(b.Y_max <= ay){
							ax= b.Y_max <= ay? ax: b.X_min - 10;
						}else{
							ax= b.X_min - 10;
						}
					}
					tx= ax;
					ty= ay;
					B= true;
					break;
				}
			}
		}
		if(over && B){
			break;	
		}
	}
	Move_cnt++;
}
ball.prototype.DrawPath= function DrawPath(c){ // line animation & ball draw
	if( mousestate % 2 === 0 || Move_cnt != c) // 방향이 다르거나 마우스클릭이 안돼있으면 return
		return;
	ctx.beginPath();
	ctx.moveTo(this.x, this.y);
	ctx.lineTo(px, py);
	ctx.stroke();
	ctx.closePath();
	ctx.lineDashOffset-= 0.7;
	this.draw("#7cd3ff", tx, ty);
	this.draw();
}
ball.prototype.update= function (){
	this.x+= this.direction[0];
	this.y-= this.direction[1];
	if(this.x+this.radius>=canvas.width || this.x<=this.radius){
		this.x= this.x+this.radius>=canvas.width? canvas.width-this.radius: this.radius;
		this.direction[0]= this.direction[0]*-1;
	}
	if(this.y+this.radius>=canvas.height || this.y<=this.radius){
		this.y= this.y+this.radius>=canvas.height? canvas.height-this.radius: this.radius;
		this.direction[1]= this.direction[1]*-1;
	}
	for(var i=0, len= Blocks.length; i<len; i++){
		if(Blocks[i] == undefined || Math.abs(Blocks[i].X_min-this.x) > 150)
			continue;
		let b= Blocks[i];
		let pointX= getPoint(this.x, b.X_min, b.X_max);
		let pointY= getPoint(this.y, b.Y_min, b.Y_max);
		if(Checkdistance(this.x, this.y, pointX, pointY)){
			const v1x = this.x - pointX;  // green line to corner
			const v1y = this.y - pointY;
			// normalize the line and rotate 90deg to get the tangent
			const len = (v1x ** 2 + v1y ** 2) ** 0.5;
			if(len <= this.radius && ( pointX == b.X_min || pointX == b.X_max) && ( pointY == b.Y_min || pointY == b.Y_max)){
				// const tx = -v1y / len;  // green line as tangent
				// const ty =  v1x / len;
				// const dot = (this.direction[0] * tx + this.direction[1] * ty) * 2; // length of orange line
				// this.direction[0] = -this.direction[0] + tx * dot; // outgoing delta (red)
				// this.direction[1] = -this.direction[1] + ty * dot;

				let x = this.x - pointX;
			    let y = this.y - pointY;
			    let c = -2 * (this.direction[0] * x + this.direction[1] * y) / (x * x + y * y);
			    this.direction[0] = this.direction[0] + c * x;
			    this.direction[1] = this.direction[1] + c * y;
			}else{
				if(pointX == b.X_max || pointX == b.X_min){ // 공의 중심점의 x좌표가 블록 x좌표 범위 밖에 있음
					this.direction[0]*=-1;
				}
				if(pointY == b.Y_max || pointY == b.Y_min){
					this.direction[1]*=-1;
				}
			}

			b.cnt--;
			if(b.cnt<=0)
				Blocks.splice(i, 1)
		}
	}
	for(var i=0, len= AddBalls.length; i<len; i++){
		if(AddBalls[i] == undefined)
			continue;
		var A= AddBalls[i];
		var pointX= A.l * Block_width + (Block_width/2);
		var pointY= A.t * Block_height + (Block_height/2);
		if(Checkdistance(this.x, this.y, pointX, pointY, A.radius+this.radius-1)){
			AddBalls.splice(i, 1);
			should_Add++;
		}
	}
	if(this.y+this.radius>=canvas.height){
		return true;
	}
	return false;
}

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
	ctx.fillStyle= "rgba(0, 0, 0, 0.2)";
	ctx.fillRect(this.l*this.w+3.5, this.t*this.h+5.5, this.w-2, this.h-2);
	ctx.fillStyle= this.c;
	ctx.fillRect(this.l*this.w+1, this.t*this.h+1, this.w-2, this.h-2);
	ctx.fillStyle= "#000";
	ctx.font = "20px sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(this.cnt, this.l*this.w+1+(this.w-2)/2, this.t*this.h+1+(this.h-2)/2+6); 
	ctx.restore();
};

function AddBall (option){
	this.radius= 15;
	this.l= option.l;
	this.t= option.t;
}
AddBall.prototype.draw = function() {
	ctx.save();
	ctx.beginPath();
	ctx.strokeStyle= "#69db7c";
	ctx.setLineDash([0,0]);
	ctx.lineWidth= 3;
	ctx.lineDashOffset= 0;
	ctx.arc(this.l*Block_width+(Block_width/2), this.t*Block_height+(Block_height/2), this.radius, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();
	ctx.beginPath();
	ctx.fillStyle= "#69db7c";
	ctx.arc(this.l*Block_width+(Block_width/2), this.t*Block_height+(Block_height/2), 9, 0, Math.PI*2);
	ctx.fill();
	ctx.closePath();
	ctx.restore();
};

function Checkdistance(x1, y1, x2, y2, distance= 10){
	let x= Math.abs(x1-x2);
	let y= Math.abs(y1-y2);
	let result= Math.sqrt(x*x+y*y);
	return distance >= result;
}
function clear (){ctx.clearRect(0,0,canvas.width,canvas.height);}
function getPoint(v, min, max){ // return pointX or pointY
	if(v <= min)
		return min
	else if(v >= max)
		return max
	else
		return v;
}
function display(){ // 캔버스에 그리기
	clear();
	for(var i=Blocks.length-1; i>=0; i--)
		if(Blocks[i] != undefined)
			Blocks[i].draw();
	for(var i=0, len= AddBalls.length; i<len; i++)
		if(AddBalls[i] != undefined)
			AddBalls[i].draw();

	if(mousestate === 2){ // 공을 날렸으면
		for(var i=0, len= Balls.length; i<len; i++)
			if(Balls[i] != undefined)
				Balls[i].draw();
	}else{ // 공 날리기전 바닥에 있을때
		Balls[0].draw();
	}
	if(mousestate === 1){ // 공 날릴려고 마우스 누르면 경로 그리기
		Balls[0].DrawPath(Move_cnt);
	}
	requestAnimationFrame(display);
}
function callback(){ // 공 날라갔다가 돌아왔을때
	for(var i=0, len= Blocks.length; i<len; i++){
		Blocks[i].t++;
		Blocks[i].Y_min= Blocks[i].t*Blocks[i].h+0.5;
		Blocks[i].Y_max= Blocks[i].Y_min+Blocks[i].h-1;
		if(Blocks[i].t==8)
			end();
	}
	for(var i=0, len= AddBalls.length; i<len; i++){
		if(AddBalls[i] != undefined){
			AddBalls[i].t++;
			if(AddBalls[i].t==7){
				AddBalls.splice(i, 1);
				should_Add++;
			}
		}
	}
	// Math.floor(turn/10); // 0 1 2 3 4 5
	let cnt= 0;
	let getrandomcnt;
	switch(Math.floor(turn/10)){
		case 0:
			cnt= Math.floor(Math.random()*2)+1 == 1? 1: 2;
			break;
		case 1:
			getrandomcnt= Math.floor(Math.random()*(10))+1;
			if(getrandomcnt<=3){
				cnt= 1;
			}else if(getrandomcnt<=9){
				cnt= 2;
			}else{
				cnt= 3;
			}
			break;
		case 2:
			getrandomcnt= Math.floor(Math.random()*(10))+1;
			if(getrandomcnt<=4){
				cnt= 2;
			}else if(getrandomcnt<=9){
				cnt= 3;
			}else{
				cnt= 4;
			}
			break;
	}
	if(Math.floor(turn/10)>=3){
		getrandomcnt= Math.floor(Math.random()*(10))+1;
		if(getrandomcnt<=4){
			cnt= 3;
		}else if(getrandomcnt<=9){
			cnt= 4;
		}else{
			cnt= 5;
		}
	}
	var bl= [];
	for(var i=0; i<cnt; i++){
		let l= Math.floor(Math.random()*6);
		if(bl.includes(l)){
			i--;
		}else{
			bl.push(l);
		}
	}
	for(var i=0; i<bl.length; i++){
		Blocks.push(new Block({l: bl[i], t: 1, cnt: turn}));
	}
	function ab(){
		let l= Math.floor(Math.random()*5);
		if(bl.includes(l)){
			ab();
		}else{
			AddBalls.push(new AddBall({l: l, t: 1}));
		}
	}
	ab();
	for(var i=0; i<should_Add; i++)
		Balls.push(new ball(Balls[0].x, Balls[0].y));
	should_Add= 0;
	for(var i=0, len= Balls.length; i<len; i++){
		Balls[i].x= Balls[0].x;
		Balls[i].y= Balls[0].y;
	}
}
let Balls= [];
let Blocks= [];
let AddBalls= [];

function Ball_update (){
	for(var i=0; i<Balls.length; i++){
		if(!Balls[i].isShoot)
			continue;
		if(Balls[i].update()){
			Balls[i].isShoot= false;
			Shootcnt--;
			if(Shootcnt === 0){
				mousestate= 0;
				callback();
				return;
			}
		}
	}
	setTimeout(function (){
		Ball_update();
	}, 1000/FPS);
}

let wrap= document.querySelector("#app");
function eve (){
	canvas.addEventListener("mousedown", function (e){
		if(mousestate === 2)
			return;
		var cx= e.pageX-wrap.getBoundingClientRect().left;
		var cy= e.pageY-wrap.getBoundingClientRect().top;
		if(!ctx.isPointInPath(Balls[0].path, cx, cy)){
			mousestate= 1;
			Balls[0].GetPath( (cx-Balls[0].x), -(cy-Balls[0].y), 0);
		}
	});
	window.addEventListener("mousemove", function (e){
		if(mousestate === 1){
			var mx= e.pageX-wrap.getBoundingClientRect().left;
			var my= e.pageY-wrap.getBoundingClientRect().top;
			if(ctx.isPointInPath(Balls[0].path, mx, my)){
				Move_cnt++;
				clear();
				Balls[0].draw();
			}else{
				Balls[0].GetPath( (mx-Balls[0].x), -(my-Balls[0].y), 0);
			}
		}
	});
	function balls_shoot(i, t){
		Balls[i].isShoot= true;
		return new Promise( (res, rej)=> {
			setTimeout(_ =>{
				return res(i);
			}, 1000 / FPS * t);
		});
	}
	window.addEventListener("mouseup", async function (e){
		if(mousestate === 1){
			mousestate= 2;
			ctx.lineDashOffset= 0;
			Shootcnt= Balls.length;
			console.log(Shootcnt);
			Ball_update();
			max= Math.max.apply(null, Balls[0].direction);
			let x= Balls[0].x;
			let y= Balls[0].y;
			let AddCount= 0;
			while(1){
				x+= Balls[0].direction[0];
				y-= Balls[0].direction[1];
				AddCount++;
				if(!Checkdistance(x, y, Balls[0].x, Balls[0].y, 24))
					break;
			}
			for(var i=0; i<Balls.length; i++){
				let s= await balls_shoot(i, AddCount);
			}
			turn++;
		}
	});
	for(var i=0, len= document.querySelectorAll("input[type='radio']").length; i<len; i++){
		document.querySelectorAll("input[type='radio']")[i].onclick= function (){
			FPS= this.value*60
		}
	}
}
window.onload= function (){
	Balls.push(new ball());
	Blocks.push(new Block({l: 0, t: 1, cnt: turn}));
	Blocks.push(new Block({l: 5, t: 1, cnt: turn}));
	AddBalls.push(new AddBall({l: 1, t: 1}));
	
	eve();
	display();
}