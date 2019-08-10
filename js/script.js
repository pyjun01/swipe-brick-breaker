(() =>{
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
	let Shootcnt= 0; // 날아가고있는 공의 개수
	let mousestate= 0; // 0= defualt 1= mousedown 2= mousemove 3= mouseup
	let should_Add= 0; // 추가해야되는 공 cnt
	let max= 0;
	let px= 0, py= 0; // 예상경로 line
	let tx= 0, ty= 0; // 예상경로 ball
	let Balls= []; // Ball array
	let Blocks= []; // 블록 array
	let AddBalls= []; // 공 추가하는거 array
	let fbid= null; // 바닥에 닿은 첫번째 공의 idx
	let wrap= document.querySelector("#app"); // wrapper tag
	let tg, ax, ay, over, B; // GetPath, DrawPath
	let Iscallback= false;
	let Isend= false;
	/* object */
	class ball {
		constructor (x, y){
			this.radius= 10; // 반지름
			this.x= x? x: W / 2; // x 좌표 값
			this.y= y? y: H-10; // y 좌표 값
			this.dx= 0; // 1 FPS당 움직이는 X 값
			this.dy= 0; // 1 FPS당 움직이는 Y 값
			this.isShoot= false; // 날아가고 있는지
			this.opacity= 1;
		}
		draw (c= `rgba(75, 188, 244, ${this.opacity || 1})`, x= this.x, y= this.y){
			ctx.save();
			ctx.beginPath();

			// ctx.fillStyle= "rgba(75, 188, 244, 0.5";
			ctx.fillStyle= c;
			ctx.arc(x, y, this.radius, 0, 2*Math.PI, false);
			ctx.fill();

			ctx.closePath();
			ctx.restore();
		}
		update (){
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
					// if( (pointX == b.X_min || pointX == b.X_max) && (pointY == b.Y_min || pointY == b.Y_max) ){
					// 	console.log("corner");
					// }
					let nx = this.x - pointX;
					let ny = this.y - pointY;
					let len = Math.sqrt(nx * nx + ny * ny); // 공과 모서리 사이 거리
					if(len <= this.radius && ( pointX == b.X_min || pointX == b.X_max) && ( pointY == b.Y_min || pointY == b.Y_max)){
						nx /= len;
						ny /= len;
						let projection = this.dx * nx + this.dy * ny;
						this.dx = this.dx - 2 * projection * nx;
						this.dy = this.dy - 2 * projection * ny;
						if(Math.abs(this.dy) < 0.2)
							this.dy+= this.dy<0? -0.2: 0.2;
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
	}
	class Block {
		constructor (option){
			this.w= W/6;
			this.h= H/9;
			this.l= option.l;
			this.t= option.t;

			this.X_min= this.l*this.w+1;
			this.Y_min= this.t*this.h+1;
			this.X_max= this.X_min+this.w-2;
			this.Y_max= this.Y_min+this.h-2;
			this.cnt= option.cnt;
			this.c= C;
		}
		draw (){
			ctx.save();
			ctx.beginPath();

			ctx.fillStyle= this.c;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
			ctx.shadowOffsetX = 3.5;
			ctx.shadowOffsetY = 3.5;
			ctx.fillRect(this.l*this.w+1, this.t*this.h+1, this.w-2, this.h-2);

			ctx.fillStyle= "#fff";
			ctx.font = "bold 20px sans-serif";
			ctx.textAlign = "center";
			ctx.shadowColor = 'transparent';
			ctx.fillText(this.cnt, this.l*this.w + this.w/2, this.t*this.h + this.h/2 +6); 

			ctx.closePath();
			ctx.restore();
		};
	}
	class AddBall {
		constructor (option){
			this.radius= 15;
			this.l= option.l;
			this.t= option.t;
		}
		draw (){
			ctx.save();
			ctx.strokeStyle= "#69db7c";
			ctx.fillStyle= "#69db7c";
			ctx.setLineDash([0,0]);
			ctx.lineWidth= 3;
			ctx.lineDashOffset= 0;

			ctx.beginPath();
			ctx.arc(this.l*Block_width+(Block_width/2), this.t*Block_height+(Block_height/2), this.radius, 0, 2 * Math.PI);
			ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
			ctx.shadowOffsetX = 3.2;
			ctx.shadowOffsetY = 3.2;
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(this.l*Block_width+(Block_width/2), this.t*Block_height+(Block_height/2), 9, 0, Math.PI*2);
			ctx.fill();
			ctx.closePath();

			ctx.restore();
		};
	}
	/* //object */
	/* function */
	const Checkdistance= (x1, y1, x2, y2, distance= 10) => distance >= Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)); // 두 점 사이의 거리를 구함
	const GetPointFromDigree= (x, y, digree, len= 15) => new Object({x: x + Math.cos(digree*(Math.PI/180))*len, y: y + Math.sin(digree*(Math.PI/180))*len}); // 각도를 통해 새로운 위치 가져옴
	const GetDigree= (x1, x2, y1, y2) => Math.atan2(x1 - x2, y1 - y2) * 180 / Math.PI; // 점 두개로 각도 구함
	const getPoint= (v, min, max) =>{ // return pointX or pointY
		if(v <= min || v >= max)
			return Math.abs(max-v) < Math.abs(min-v)? max: min;
		return v;
	}
	const display= () =>{ // display function
		clear(); // clear canvas
		Blocks.forEach(v =>{
			if(v) v.draw();
		});
		AddBalls.forEach(v =>{
			if(v) v.draw();
		})
		if(Iscallback){
			Balls.forEach(v =>{
				if(v) v.draw();
			});
		}else{
			if(mousestate === 2){ // 공을 날렸으면
				Balls.forEach(v =>{
					if(v) v.draw();
				});
			}else{ // 공이 바닥에 있을때
				Balls[0].draw();
			}
		}
		if(mousestate === 1)
		DrawPath(Move_cnt); // 공 날릴려고 마우스 누르면 경로 그리기
		if(Isend) return end();
		requestAnimationFrame(() =>{
			setTimeout(display, 1000/60);
		});
	}
	const clear= () => ctx.clearRect(0, 0, canvas.width, canvas.height); // canvas clear
	const GetPath= (lx, ly) =>{ // get path
		ly*= -1;
		for(var i=0, len= Balls.length; i<len; i++){
			Balls[i].dx= lx;
			Balls[i].dy= ly;
		}
		tg= Balls[0];
		ax= tg.x, ay= tg.y;
		over= false, B= false;
		while( (ax + tg.radius <= W || ax >= 0) || (ay + tg.radius <= canvas.height || ay >= 0) ){
			ax+= lx;
			ay+= ly;
			if(!over){ // 벽
				if(ax + tg.radius >= W || ax <= tg.radius){
					ax= ax + tg.radius >= W?  W - tg.radius: tg.radius;
					over= true;
				}
				if(ay + tg.radius >= H || ay <= tg.radius){
					ay= ay + tg.radius >= H? H - tg.radius: tg.radius;
					over= true;
				}
				if(over){
					px= ax;
					py= ay;
				}
			}
			if(!B){ // 블록
				if(over){
					tx= ax;
					ty= ay;
					break;
				}
				for(var i=0, len= Blocks.length; i<len; i++){
					let b= Blocks[i];
					let pointX= getPoint(ax, b.X_min, b.X_max);
					let pointY= getPoint(ay, b.Y_min, b.Y_max);
					if(Checkdistance(ax, ay, pointX, pointY)){
						if(pointY == b.Y_max && (b.X_min < ax && ax > b.X_max)){
							ay= b.Y_max + 10;
						}else if(pointX == b.X_max && (ay > b.Y_min && b.Y_max > ay)){
							ax= b.X_max + 10;
						}else if(pointX == b.X_min && (ay > b.Y_min && b.Y_max > ay))
							ax= b.X_min - 10;
						tx= ax;
						ty= ay;
						B= true;
						break;
					}
				}
			}
			if(over && B) break;
		}
		Move_cnt++;
	}
	const DrawPath= c =>{ // line animation & ball draw
		if( mousestate % 2 === 0 || Move_cnt != c) // 방향이 다르거나 마우스클릭이 안돼있으면 return
			return;
		tg= Balls[0];
		ctx.beginPath();
		ctx.moveTo(tg.x, tg.y);
		ctx.lineTo(px, py);
		ctx.stroke();
		ctx.closePath();
		ctx.lineDashOffset-= 1;
		tg.draw("#7cd3ff", tx, ty);
		tg.draw();
	}
	const eve= () =>{
		canvas.addEventListener("mousedown", onMouseDown);
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		let radio= document.querySelectorAll("input[type='radio']");
		for(let i=0, len= radio.length; i<len; i++){
			radio[i].onclick= function (){
				FPS= this.value*60;
			}
		}
	}
	const onMouseDown= e =>{
		if(mousestate === 2 || Iscallback) return; // mouseup 한 상태이면
		mousestate= 1; // mousedown 한 상태
		onMouse(e);
	}
	const onMouseMove= e =>{
		if(mousestate === 1) onMouse(e, 1); // mousedown 한 상태이면
	}
	const onMouseUp= async e =>{
		if(mousestate === 1){ // if mousedown
			mousestate= 2; // mousestate= mouseup
			ctx.lineDashOffset= 0; // 예상 경로 초기화
			Shootcnt= Balls.length; // ball 개수만큼 Shootcnt 설정
			Ball_update(); // 공 업데이트
			max= Math.max(Balls[0].dx, Balls[0].dy);
			let b0= Balls[0];
			
			let digree= GetDigree(b0.x + b0.dx, b0.x, b0.y - b0.dy, b0.y);
			digree= digree<0? -270-(digree): 90-(digree);
			let point= GetPointFromDigree(b0.x, b0.y, digree, 30);
			let tick= Math.abs(Math.floor(Math.abs(point.x - b0.x) / b0.dx));
			for(var i=0; i<Balls.length; i++){
				let s= await balls_shoot(i, tick);
			}
			console.log(Balls.map(v => v.opacity));
			turn++;
		}
	}
	const onMouse= (e) =>{ // mousedown, mousemove event
		pos= {
			x: e.pageX-wrap.getBoundingClientRect().left,
			y: e.pageY-wrap.getBoundingClientRect().top - document.querySelector("span").offsetHeight
		};
		let digree= GetDigree(pos.x, Balls[0].x, pos.y, Balls[0].y); // get digree between mousedown_position and ball_position

		let min_angle= 12; // 좌우 최소 각도
		if(Math.abs(digree)<90+min_angle){ // 공과 마우스 커서 사이 각도가 100도 이하이면 최솟값으로 변경
			let point= 
				digree>0
				? GetPointFromDigree(Balls[0].x, Balls[0].y, -min_angle, 3)
				: GetPointFromDigree(Balls[0].x, Balls[0].y, -180+min_angle, 3);
			GetPath( (point.x - Balls[0].x), -(point.y-Balls[0].y));
			return;
		}
		digree= digree<0? -270-(digree): 90-(digree);
		let point= GetPointFromDigree(Balls[0].x, Balls[0]. y, digree, 3);
		GetPath( (point.x - Balls[0].x), -(point.y-Balls[0].y));
	}
	const Ball_update= () =>{
		if(Blocks.length == 0 && AddBalls.length == 0 && Balls[fbid]){
			// console.log(fbid);
			return smoothCallback(0);
		}else{
			// console.log(Blocks.length, AddBalls.length);
		}
		for(var i=0, len= Balls.length; i<len; i++){
			if(!Balls[i].isShoot)
				continue;
			if(Balls[i].update()){
				Balls[i].isShoot= false;
				if(Balls.length == Shootcnt){
					fbid= i;
				}
				Shootcnt--;
				if(Shootcnt === 0){
					mousestate= 0;
					return callback();
				}
			}
		}
		setTimeout(function (){
			return Ball_update();
		}, 1000/144);
	}

	const smoothCallback= n =>{
		if(n>=72){
			Shootcnt= 0;
			mousestate= 0;
			for(var i=0, len= Balls.length; i<len; i++){
				Balls[i].x= Balls[fbid].x;
				Balls[i].y= Balls[fbid].y;
				Balls[i].opacity= 1;
			}
			return callback();
			return;
		}
		for(var i=0, len= Balls.length; i<len; i++){
			if(!Balls[i].isShoot)
				continue;
			if(Balls[i].update()){
				Balls[i].isShoot= false;
				Balls[i].opacity= 1;
				Shootcnt--;
				if(Shootcnt === 0){
					mousestate= 0;
					return callback();
				}
			}else{
				Balls[i].opacity-= 0.01;
			}
		}
		setTimeout(function (){
			return smoothCallback(n+1);
		}, 1000/144);
	}
	const callback= async () =>{ // 공 날라갔다가 돌아왔을때
		Iscallback= true;
		/* block, addball update */
		Blocks= Blocks.map(v =>{
			if(v.opacity != 1) v.opacity= 1;
			v.t++;
			v.Y_min+= v.h;
			v.Y_max+= v.h;
			return v;
		});
		AddBalls= AddBalls.map( (v, n) =>{
			v.t++;
			if(v.t==7){
				AddBalls.splice(n, 1);
				should_Add++;
			}
			return v;
		})
		/* //block, addball update */
		/* block cnt */
		let cnt= 0;
		let getrandomcnt= Math.floor(Math.random()*(10))+1;
		if(turn < 10){
			cnt= Math.floor(Math.random()*2)+1 == 1? 1: 2;
		}else{
			if(getrandomcnt<=3){
				cnt= 1+(Math.floor(turn/10) > 2? 2: Math.floor(turn/10));
			}else if(getrandomcnt<=6){
				cnt= 2+(Math.floor(turn/10) > 2? 2: Math.floor(turn/10));
			}else{
				cnt= 3+(Math.floor(turn/10) > 2? 2: Math.floor(turn/10));
			}
		}
		/* //block cnt */
		/* block */
		var bl= [];
		for(var i=0; i<cnt; i++){
			let l= Math.floor(Math.random()*6);
			if(bl.includes(l)){
				i--;
			}else{
				bl.push(l);
				Blocks.push(new Block({l: l, t: 1, cnt: turn}));
			}
		}
		/* //block */
		/* addvall */
		function recursive(){
			let l= Math.floor(Math.random()*6);
			if(bl.includes(l)){
				recursive();
			}else{
				AddBalls.push(new AddBall({l: l, t: 1}));
			}
		}
		recursive();
		/* //addvall */
		/* ball */
		for(var i=0; i<should_Add; i++){
			Balls.push(new ball(Balls[fbid].x, Balls[fbid].y));
		}
		should_Add= 0;
		if(Blocks.find(f => f.t == 8)) return end();
		await Ball_Gather();
		// for(var i=0, len= Balls.length; i<len; i++){
		// 	Balls[i].x= Balls[fbid].x;
		// 	Balls[i].y= Balls[fbid].y;
		// }
		/* //ball */
		document.querySelector(".score").innerText= turn;
		document.querySelector(".b").innerText= Balls.length;
		Iscallback= false;
		fbid= null;
	}
	const Ball_Gather= () =>{ // 공 모으는 애니메이션
		let distance= [];
		let cnt= 10;
		for(var i=0, len= Balls.length; i<len; i++){
			Balls[i].y= Balls[fbid].y;
			let dis= fbid == i? 0: (Balls[fbid].x - Balls[i].x) / cnt;
			distance.push( dis );
		}
		return new Promise(res =>{
			function recursive (n){
				for(var i=0, len= Balls.length; i<len; i++){
					Balls[i].x+= distance[i];
				}
				setTimeout( () =>{
					if(n < cnt-1){
						recursive(n+1);
					}else{
						for(var i=0, len= Balls.length; i<len; i++){
							Balls[i].x= Balls[fbid].x;
						}
						res(true);
					}
				}, 1000 / 60);
			}
			recursive(0);
		})
	}
	const end= () => { // 게임 끝났을때
		Isend= true;
		canvas.removeEventListener("mousedown", onMouseDown);
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("mouseup", onMouseUp);
		ctx.fillStyle= "rgba(0, 0, 0, 0.3)";
		ctx.fillRect(0, 0, W, H);
	};
	const balls_shoot= (i, t) =>{
		return new Promise( (res, rej)=> {
			Balls[i].isShoot= true;
			setTimeout(() =>{
				return res(i);
			}, 1000 / 144 * t);
		});
	}
	/* //function */
	window.onload= () =>{
		Balls.push(new ball());
		Blocks.push(new Block({l: 0, t: 1, cnt: turn}));
		Blocks.push(new Block({l: 5, t: 1, cnt: turn}));
		AddBalls.push(new AddBall({l: 1, t: 1}));
		eve();
		display();
	}
})();