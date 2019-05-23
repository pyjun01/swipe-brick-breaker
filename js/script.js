const canvas= document.getElementById("canvas");
const ctx= canvas.getContext('2d');
let FPS= 60;
let turn= 1;
let W= canvas.width;
let H= canvas.height;
/* canvas default setting */
ctx.setLineDash([5, 5]);
ctx.strokeStyle= "#A5DDF9";
ctx.lineCap= 'round';
ctx.lineWidth= 2;
/* //canvas default setting */
const C= "#F5936C"; // default block color
const Block_width= W/6; // block width
const Block_height= H/9; // block height
let Move_cnt= 0; // mousemove cnt (예상경로 움직이는데 사용됨)
let tx=0; // 공이 닿을 x 좌표값
let ty= 0; // 공이 닿을 y 좌표값
let Shootcnt= 0; // 날아가고있는 공의 개수
let mousestate= 0; // 0= defualt 1= mousedown 2= mousemove 3= mouseup
let should_Add= 0; // 추가해야되는 공 cnt
let max= 0;
let px= 0, py= 0;
/* ball object */
function ball(x, y){
	this.path= new Path2D(); // Path2D
	this.radius= 10; // 반지름
	this.x= x? x: W / 2; // x 좌표 값
	this.y= y? y: H-10; // y 좌표 값
	this.dx= 0; // 1 FPS당 움직이는 X 값
	this.dy= 0; // 1 FPS당 움직이는 Y 값
	this.isShoot= false; // 날아가고 있는지
}
ball.prototype.draw = function (c= "#4BBCF4", x= this.x, y= this.y){
	this.path= new Path2D();
	ctx.save();
	ctx.fillStyle= c;
	this.path.arc(x, y, this.radius, 0, 2*Math.PI, false);
	ctx.fill(this.path);
	ctx.restore();
};
ball.prototype.GetPath= function GetPath (lx, ly, re){ // get path
	var min_range= 3;
	var max_range= 3.5;
	ly*= -1;
	for(var i=0, len= Balls.length; i<len; i++){
		// Balls[i].direction= [lx, ly];
		Balls[i].dx= lx;
		Balls[i].dy= ly;
	}
	var ax= this.x;
	var ay= this.y;
	var over= false;
	var B= false;
	while( (ax + this.radius <= W || ax >= 0) || (ay + this.radius <= canvas.height || ay >= 0) ){ // 벽에 닿을때까지
		/* 현재 공의 위치가 담긴 변수인 ax, ay에 값을 더해줌*/
		ax+= lx;
		ay+= ly;
		if(!over){
			if(ax + this.radius >= W || ax <= this.radius){ // 좌우벽중에 닿았으면
				ax= ax + this.radius >= W?  W - this.radius: this.radius;
				over= true;
			}
	 		if(ay + this.radius >= H || ay <= this.radius){ // 위에있는 벽에 닿았으면
				ay= ay + this.radius >= H? H - this.radius: this.radius;
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
	ctx.lineDashOffset-= 1;
	this.draw("#7cd3ff", tx, ty);
	this.draw();
}
ball.prototype.update= function (){
	this.x+= this.dx;
	this.y+= this.dy;
	if(this.x+this.radius>=canvas.width || this.x<=this.radius){
		this.x= this.x+this.radius>=canvas.width? canvas.width-this.radius: this.radius;
		this.dx= this.dx*-1;
	}
	if(this.y+this.radius>=canvas.height || this.y<=this.radius){
		this.y= this.y+this.radius>=canvas.height? canvas.height-this.radius: this.radius;
		this.dy= this.dy*-1;
	}
	for(var i=0, len= Blocks.length; i<len; i++){
		if(Blocks[i] == undefined || Math.abs(Blocks[i].X_min-this.x) > 150)
			continue;
		let b= Blocks[i];
		let pointX= getPoint(this.x, b.X_min, b.X_max);
		let pointY= getPoint(this.y, b.Y_min, b.Y_max);
		if(Checkdistance(this.x, this.y, pointX, pointY)){
			if( (pointX == b.X_min || pointX == b.X_max) && (pointY == b.Y_min || pointY == b.Y_max) ){
				console.log("corner");
			}
			let nx = this.x - pointX;
			let ny = this.y - pointY;
			let len = Math.sqrt(nx * nx + ny * ny); // 공과 모서리 사이 거리
			if(len <= this.radius && ( pointX == b.X_min || pointX == b.X_max) && ( pointY == b.Y_min || pointY == b.Y_max)){
				nx /= len;
				ny /= len;
				let projection = this.dx * nx + this.dy * ny;
				this.dx = this.dx - 2 * projection * nx;
				this.dy = this.dy - 2 * projection * ny;
			}else{
				if(pointX == b.X_max || pointX == b.X_min){ // 공의 중심점의 x좌표가 블록 x좌표 범위 밖에 있음
					this.x= pointX==b.X_max? pointX+10: pointX-10;
					this.dx*=-1;
				}
				if(pointY == b.Y_max || pointY == b.Y_min){
					this.y= pointY==b.Y_max? pointY+10: pointY-10;
					this.dy*=-1;
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
/* //ball object */
/* Block object */
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
	// Blocks.reduce( (max, v) => {

	// });
	for(var i=0, len=Blocks.length; i<len; i++){

	}
	this.c= C;
}
Block.prototype.draw = function (){
	ctx.save();
	ctx.fillStyle= "rgba(0, 0, 0, 0.2)";
	ctx.fillRect(this.l*this.w+3.5, this.t*this.h+5.5, this.w-2, this.h-2);
	ctx.fillStyle= this.c;
	ctx.fillRect(this.l*this.w+1, this.t*this.h+1, this.w-2, this.h-2);
	ctx.fillStyle= "#fff";
	ctx.font = "bold 20px sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(this.cnt, this.l*this.w+1+(this.w-2)/2, this.t*this.h+1+(this.h-2)/2+6); 
	ctx.restore();
};
/* //Block object */
/* AddBall object */
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
/* //AddBall object */

let Balls= []; // Ball array
let Blocks= []; // 블록 array
let AddBalls= []; // 공 추가하는거 array
let fbid= 0; // 바닥에 닿은 첫번째 공의 idx

const Checkdistance= (x1, y1, x2, y2, distance= 10) => distance >= Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)); // 두 점 사이의 거리를 구함
const GetPointFromDigree= (x, y, digree, len= 15) => new Object({x: x + Math.cos(digree*(Math.PI/180))*len, y: y + Math.sin(digree*(Math.PI/180))*len}); // 각도를 통해 새로운 위치 가져옴
const clear= _ => ctx.clearRect(0, 0, canvas.width, canvas.height); // canvas clear
const GetDigree= (x1, x2, y1, y2) => Math.atan2(x1 - x2, y1 - y2) * 180 / Math.PI; // 점 두개로 각도 구함
const end= _ => {}; // 게임 끝났을때

let wrap= document.querySelector("#app"); // wrapper tag
let mousedown_pos= { x: 0, y: 0 }; // mousedown postiion object
let mousemove_pos= { x: 0, y: 0 }; // mousemove postiion object
const onMouse= (e, ms= 1) =>{ // mousedown, mousemove event
	pos= {
		x: e.pageX-wrap.getBoundingClientRect().left,
		y: e.pageY-wrap.getBoundingClientRect().top - document.querySelector("span").offsetHeight
	};
	let digree= GetDigree(pos.x, Balls[0].x, pos.y, Balls[0].y); // get digree between mousedown_position and ball_position
	console.log(digree);
	if(Math.abs(digree)<100){ // 공과 마우스 커서 사이 각도가 100도 이하이면 최솟값으로 변경
		let point= 
			digree>0
			? GetPointFromDigree(Balls[0].x, Balls[0].y, -10, 3)
			: GetPointFromDigree(Balls[0].x, Balls[0].y, -170, 3);
		Balls[0].GetPath( (point.x - Balls[0].x), -(point.y-Balls[0].y), 0);
		return;
	} 
	if(ms && ctx.isPointInPath(Balls[0].path, mousemove_pos.x, mousemove_pos.y)) return;
	digree= digree<0? -270-(digree): 90-(digree);
	let point= GetPointFromDigree(Balls[0].x, Balls[0]. y, digree, 3);
	Balls[0].GetPath( (point.x - Balls[0].x), -(point.y-Balls[0].y), 0);
}

function getPoint(v, min, max){ // return pointX or pointY
	if(v <= min || v >= max)
		return Math.abs(max-v) < Math.abs(min-v)? max: min;
	return v;
}
function display(){ // display function
	clear(); // clear canvas
	for(var i=Blocks.length-1; i>=0; i--) // block draw
		if(Blocks[i] != undefined)
			Blocks[i].draw();
	for(var i=0, len= AddBalls.length; i<len; i++) // addball draw
		if(AddBalls[i] != undefined)
			AddBalls[i].draw();
	if(mousestate === 2){ // 공을 날렸으면
		for(var i=0, len= Balls.length; i<len; i++)
			if(Balls[i] != undefined)
				Balls[i].draw();
	}else{ // 공이 바닥에 있을때
		Balls[0].draw();
	}
	if(mousestate === 1)
		Balls[0].DrawPath(Move_cnt); // 공 날릴려고 마우스 누르면 경로 그리기
	requestAnimationFrame(_ =>{
		setTimeout(display, 1000/60);
	});
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
	// 여기서 블럭 색깔 지정해줌
	/*
		블럭들 cnt를 배열에 넣고 내림차순 정렬해주고 배열에 idx값에 맞게 색깔넣기?
		let cs= [];
		for(var i=0, len= Blocks.length; i<len; i++){
			cs.push(Blocks[i].cnt);
		}
		cs= cs.sort((a,b)=>b-a).filter( (v,idx) => cs.indexOf(v)===idx);
		for(var i=0, len= cs.length; i<len; i++){
			for(var j=0;j<Blocks.length; j++){
				if(Blocks[j].cnt===cs[i])
					Blocks[j].c= C;
			}
		}
	*/
	for(var i=0, len= Blocks.length; i<len; i++)
		Blocks[i].c= C;
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
		Balls[i].x= Balls[fbid].x;
		Balls[i].y= Balls[fbid].y;
	}
	document.querySelector(".score").innerText= turn;
	document.querySelector(".b").innerText= Balls.length;
}
function Ball_update (){
	for(var i=0; i<Balls.length; i++){
		if(!Balls[i].isShoot)
			continue;
		if(Balls[i].update()){
			Balls[i].isShoot= false;
			if(Balls.length == Shootcnt)
				fbid= i;
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
	}, 500/FPS);
}
function balls_shoot(i, t){
		Balls[i].isShoot= true;
		return new Promise( (res, rej)=> {
			setTimeout(_ =>{
				return res(i);
			}, 1000 / FPS * t);
		});
	}
function eve (){
	canvas.addEventListener("mousedown", function (e){
		if(mousestate === 2) return; // mouseup 한 상태이면
		mousestate= 1; // mousedown 한 상태
		onMouse(e);
	});
	window.addEventListener("mousemove", function (e){
		if(mousestate === 1) onMouse(e, 1); // mousedown 한 상태이면
	});
	window.addEventListener("mouseup", async function (e){
		if(mousestate === 1){ // if mousedown
			mousestate= 2; // mousestate= mouseup
			ctx.lineDashOffset= 0; // 예상 경로 초기화
			Shootcnt= Balls.length; // ball 개수만큼 Shootcnt 설정
			Ball_update(); // 공 업데이트
			max= Math.max(Balls[0].dx, Balls[0].dy);
			let x= Balls[0].x;
			let y= Balls[0].y;
			let AddCount= 0;
			while(1){
				x+= Balls[0].dx;
				y-= Balls[0].dy;
				AddCount++;
				if(!Checkdistance(x, y, Balls[0].x, Balls[0].y, 15))
					break;
			}
			for(var i=0; i<Balls.length; i++){
				let s= await balls_shoot(i, AddCount);
			}
			turn++;
		}
	});
	let radio= document.querySelectorAll("input[type='radio']");
	for(let i=0, len= radio.length; i<len; i++){
		radio[i].onclick= function (){
			FPS= this.value*60;
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
