import { SoundManager } from './audio.js';

(() => {
  const soundManager = new SoundManager();

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const TOP_BAR_HEIGHT = 30;
  let turn = 1;
  let W = canvas.width;
  let H = canvas.height;
  /* canvas default setting */
  ctx.strokeStyle = '#A5DDF9';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  /* //canvas default setting */
  const C = '#F5936C'; // default block color
  const BLOCK_WIDTH = W / 6; // block width
  const BLOCK_HEIGHT = H / 9; // block height
  let moveCount = 0; // mousemove cnt (예상경로 움직이는데 사용됨)
  let shootCount = 0; // 날아가고있는 공의 개수
  let mouseState = 0; // 0 = defualt 1 = mousedown & mousemove 2 = mouseup
  let shouldAdd = 0; // 추가해야되는 공 cnt
  let px = 0,
    py = 0; // 예상경로 line
  let tx = 0,
    ty = 0; // 예상경로 ball
  let balls = []; // Ball array
  let blocks = []; // 블록 array
  let addBalls = []; // 공 추가하는거 array
  let fb;
  let fbId = null; // 바닥에 닿은 첫번째 공의 idx
  let wrap = document.querySelector('#app > div'); // wrapper tag
  let ax, ay, over, B; // GetPath, DrawPath
  let isCallback = false;
  let isEnd = false;
  /* object */
  class Ball {
    constructor(x, y) {
      this.radius = 10; // 반지름
      this.x = x ? x : W / 2; // x 좌표 값
      this.y = y ? y : H - 10; // y 좌표 값
      this.dx = 0; // 1 FPS당 움직이는 X 값
      this.dy = 0; // 1 FPS당 움직이는 Y 값
      this.isShoot = false; // 날아가고 있는지
      this.opacity = 1;
    }
    draw(c = `rgba(75, 188, 244, ${this.opacity || 1})`, x = this.x, y = this.y) {
      ctx.save();
      ctx.beginPath();

      // ctx.fillStyle= "rgba(75, 188, 244, 0.5";
      ctx.fillStyle = c;
      ctx.arc(x, y, this.radius, 0, 2 * Math.PI, false);
      ctx.fill();

      ctx.closePath();
      ctx.restore();
    }
    update() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.x + this.radius >= canvas.width || this.x <= this.radius) {
        this.x = this.x + this.radius >= canvas.width ? canvas.width - this.radius : this.radius;
        this.dx = this.dx * -1;
      }
      if (this.y + this.radius >= canvas.height || this.y <= this.radius) {
        this.y = this.y + this.radius >= canvas.height ? canvas.height - this.radius : this.radius;
        this.dy = this.dy * -1;
      }
      for (let i = 0, len = blocks.length; i < len; i++) {
        if (blocks[i] == undefined || Math.abs(blocks[i].X_min - this.x) > 150) continue;
        let b = blocks[i];
        let pointX = getPoint(this.x, b.X_min, b.X_max);
        let pointY = getPoint(this.y, b.Y_min, b.Y_max);
        if (checkDistance(this.x, this.y, pointX, pointY)) {
          // if( (pointX == b.X_min || pointX == b.X_max) && (pointY == b.Y_min || pointY == b.Y_max) ){
          // 	console.log("corner");
          // }
          let nx = this.x - pointX;
          let ny = this.y - pointY;
          let len = Math.sqrt(nx * nx + ny * ny); // 공과 모서리 사이 거리
          if (len <= this.radius && (pointX == b.X_min || pointX == b.X_max) && (pointY == b.Y_min || pointY == b.Y_max)) {
            nx /= len;
            ny /= len;
            let projection = this.dx * nx + this.dy * ny;
            this.dx = this.dx - 2 * projection * nx;
            this.dy = this.dy - 2 * projection * ny;
            if (Math.abs(this.dy) < 0.2) this.dy += this.dy < 0 ? -0.2 : 0.2;
          } else {
            if (pointX == b.X_max || pointX == b.X_min) {
              // 공의 중심점의 x좌표가 블록 x좌표 범위 밖에 있음
              this.x = pointX == b.X_max ? pointX + 10 : pointX - 10;
              this.dx *= -1;
            }
            if (pointY == b.Y_max || pointY == b.Y_min) {
              this.y = pointY == b.Y_max ? pointY + 10 : pointY - 10;
              this.dy *= -1;
            }
          }

          b.cnt--;
          if (b.cnt <= 0) {
            blocks.splice(i, 1);
            soundManager.play('brickDestruction');
          } else {
            soundManager.play('brickHit');
          }
        }
      }
      for (let i = 0, len = addBalls.length; i < len; i++) {
        if (addBalls[i] == undefined) continue;
        var A = addBalls[i];
        var pointX = A.l * BLOCK_WIDTH + BLOCK_WIDTH / 2;
        var pointY = A.t * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        if (checkDistance(this.x, this.y, pointX, pointY, A.radius + this.radius - 1)) {
          addBalls.splice(i, 1);
          shouldAdd++;
          soundManager.play('coin');
        }
      }
      if (this.y + this.radius >= canvas.height) {
        return true;
      }
      return false;
    }
  }
  class Block {
    constructor(option) {
      this.w = W / 6;
      this.h = H / 9;
      this.l = option.l;
      this.t = option.t;

      this.X_min = this.l * this.w + 1;
      this.Y_min = this.t * this.h + 1;
      this.X_max = this.X_min + this.w - 2;
      this.Y_max = this.Y_min + this.h - 2;
      this.cnt = option.cnt;
      this.c = C;
    }
    draw() {
      ctx.save();
      ctx.beginPath();

      ctx.fillStyle = this.c;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowOffsetX = 3.5;
      ctx.shadowOffsetY = 3.5;
      ctx.fillRect(this.l * this.w + 1, this.t * this.h + 1, this.w - 2, this.h - 2);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'transparent';
      ctx.fillText(this.cnt, this.l * this.w + this.w / 2, this.t * this.h + this.h / 2 + 6);

      ctx.closePath();
      ctx.restore();
    }
  }
  class AddBall {
    constructor(option) {
      this.radius = 15;
      this.l = option.l;
      this.t = option.t;
    }
    draw() {
      ctx.save();
      ctx.strokeStyle = '#69db7c';
      ctx.fillStyle = '#69db7c';
      ctx.lineWidth = 3;
      ctx.lineDashOffset = 0;

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(this.l * BLOCK_WIDTH + BLOCK_WIDTH / 2, this.t * BLOCK_HEIGHT + BLOCK_HEIGHT / 2, this.radius, 0, 2 * Math.PI);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowOffsetX = 3.2;
      ctx.shadowOffsetY = 3.2;
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(this.l * BLOCK_WIDTH + BLOCK_WIDTH / 2, this.t * BLOCK_HEIGHT + BLOCK_HEIGHT / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();

      ctx.restore();
    }
  }
  /* //object */
  /* function */
  const checkDistance = (x1, y1, x2, y2, distance = 10) => distance >= Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); // 두 점 사이의 거리를 구함
  const getPointFromDigree = (x, y, digree, len = 15) =>
    new Object({
      x: x + Math.cos(digree * (Math.PI / 180)) * len,
      y: y + Math.sin(digree * (Math.PI / 180)) * len,
    }); // 각도를 통해 새로운 위치 가져옴
  const getDigree = (x1, x2, y1, y2) => (Math.atan2(x1 - x2, y1 - y2) * 180) / Math.PI; // 점 두개로 각도 구함
  const getPoint = (v, min, max) => {
    // return pointX or pointY
    if (v <= min || v >= max) return Math.abs(max - v) < Math.abs(min - v) ? max : min;
    return v;
  };
  const display = () => {
    if (isEnd) return;
    // display function
    clear(); // clear canvas
    blocks.forEach((v) => {
      if (v) v.draw();
    });
    addBalls.forEach((v) => {
      if (v) v.draw();
    });
    if (isCallback) {
      balls.forEach((v) => {
        if (v) v.draw();
      });
    } else {
      if (mouseState === 2) {
        // 공을 날렸으면
        balls.forEach((v) => {
          if (v) v.draw();
        });
      } else {
        // 공이 바닥에 있을때
        fb.draw();
      }
    }
    if (mouseState === 1) drawPath(moveCount); // 공 날릴려고 마우스 누르면 경로 그리기
    requestAnimationFrame(() => {
      setTimeout(display, 1000 / 60);
    });
  };
  const clear = () => ctx.clearRect(0, 0, canvas.width, canvas.height); // canvas clear
  const getPath = (lx, ly) => {
    // get path
    ly *= -1;
    for (let i = 0, len = balls.length; i < len; i++) {
      balls[i].dx = lx;
      balls[i].dy = ly;
    }
    ax = fb.x;
    ay = fb.y;
    over = false;
    B = false;
    while (ax + fb.radius <= W || ax >= 0 || ay + fb.radius <= canvas.height || ay >= 0) {
      ax += lx;
      ay += ly;
      if (!over) {
        // 벽
        if (ax + fb.radius >= W || ax <= fb.radius) {
          ax = ax + fb.radius >= W ? W - fb.radius : fb.radius;
          over = true;
        }
        if (ay + fb.radius >= H || ay <= fb.radius) {
          ay = ay + fb.radius >= H ? H - fb.radius : fb.radius;
          over = true;
        }
        if (over) {
          px = ax;
          py = ay;
        }
      }
      if (!B) {
        // 블록
        if (over) {
          tx = ax;
          ty = ay;
          break;
        }
        for (let i = 0, len = blocks.length; i < len; i++) {
          let b = blocks[i];
          let pointX = getPoint(ax, b.X_min, b.X_max);
          let pointY = getPoint(ay, b.Y_min, b.Y_max);
          if (checkDistance(ax, ay, pointX, pointY)) {
            if (pointY == b.Y_max && b.X_min < ax && ax > b.X_max) {
              ay = b.Y_max + 10;
            } else if (pointX == b.X_max && ay > b.Y_min && b.Y_max > ay) {
              ax = b.X_max + 10;
            } else if (pointX == b.X_min && ay > b.Y_min && b.Y_max > ay) ax = b.X_min - 10;
            tx = ax;
            ty = ay;
            B = true;
            break;
          }
        }
      }
      if (over && B) break;
    }
    moveCount++;
  };
  const drawPath = (c) => {
    // line animation & ball draw
    if (mouseState % 2 === 0 || moveCount != c)
      // 방향이 다르거나 마우스클릭이 안돼있으면 return
      return;
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(fb.x, fb.y);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.closePath();
    ctx.lineDashOffset -= 1;
    fb.draw('#7cd3ff', tx, ty);
    fb.draw();
  };
  const eve = () => {
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', touchToMouseDown);
    window.addEventListener('touchmove', touchToMouseMove);
    window.addEventListener('touchend', touchToMouseUp);
    // Sound toggle 연동
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundManager.setEnabled(soundToggle.checked);
      soundToggle.addEventListener('change', () => {
        soundManager.setEnabled(soundToggle.checked);
      });
      // 초기 상태 반영
    }
  };
  const onMouseDown = (e) => {
    if (mouseState === 2 || isCallback) return; // mouseup 한 상태이면
    mouseState = 1; // mousedown 한 상태
    onMouse(e);
  };
  const onMouseMove = (e) => {
    if (mouseState === 1) {
      onMouse(e); // mousedown 한 상태이면
    }
  };
  const onMouseUp = async () => {
    if (mouseState === 1) {
      // if mousedown
      mouseState = 2; // mousestate= mouseup
      ctx.lineDashOffset = 0; // 예상 경로 초기화
      shootCount = balls.length; // ball 개수만큼 Shootcnt 설정
      ballUpdate(); // 공 업데이트
      let digree = getDigree(fb.x + fb.dx, fb.x, fb.y - fb.dy, fb.y);
      digree = digree < 0 ? -270 - digree : 90 - digree;
      let point = getPointFromDigree(fb.x, fb.y, digree, 30);
      let tick = Math.abs(Math.floor(Math.abs(point.x - fb.x) / fb.dx));
      for (let i = 0; i < balls.length; i++) {
        await ballsShoot(i, tick);
      }
      turn++;
    }
  };
  const onMouse = (e) => {
    // mousedown, mousemove event

    const pos = {
      x: (e.pageX * 450) / canvas.clientWidth - wrap.getBoundingClientRect().left,
      y: (e.pageY * 450) / canvas.clientHeight - wrap.getBoundingClientRect().top - TOP_BAR_HEIGHT,
    };
    let digree = getDigree(pos.x, fb.x, pos.y, fb.y); // get digree between mousedown_position and ball_position

    let min_angle = 12; // 좌우 최소 각도
    if (Math.abs(digree) < 90 + min_angle) {
      // 공과 마우스 커서 사이 각도가 100도 이하이면 최솟값으로 변경
      let point = digree > 0 ? getPointFromDigree(fb.x, fb.y, -min_angle, 3) : getPointFromDigree(fb.x, fb.y, -180 + min_angle, 3);
      getPath(point.x - fb.x, -(point.y - fb.y));
      return;
    }
    digree = digree < 0 ? -270 - digree : 90 - digree;
    let point = getPointFromDigree(fb.x, fb.y, digree, 3);
    getPath(point.x - fb.x, -(point.y - fb.y));
  };
  const ballUpdate = () => {
    if (blocks.length == 0 && addBalls.length == 0 && balls[fbId]) {
      // console.log(fbId);
      return smoothCallback(0);
    } else {
      // console.log(Blocks.length, AddBalls.length);
    }
    for (let i = 0, len = balls.length; i < len; i++) {
      if (!balls[i].isShoot) continue;
      if (balls[i].update()) {
        balls[i].isShoot = false;
        if (balls.length == shootCount) {
          fbId = i;
        }
        shootCount--;
        if (shootCount === 0) {
          mouseState = 0;
          return callback();
        }
      }
    }
    setTimeout(function () {
      return ballUpdate();
    }, 1000 / 144);
  };

  const smoothCallback = (n) => {
    if (n >= 72) {
      shootCount = 0;
      mouseState = 0;
      for (let i = 0, len = balls.length; i < len; i++) {
        balls[i].x = balls[fbId].x;
        balls[i].y = balls[fbId].y;
        balls[i].opacity = 1;
      }
      callback();
      return;
    }
    for (let i = 0, len = balls.length; i < len; i++) {
      if (!balls[i].isShoot) continue;
      if (balls[i].update()) {
        balls[i].isShoot = false;
        balls[i].opacity = 1;
        shootCount--;
        if (shootCount === 0) {
          mouseState = 0;
          callback();
          return;
        }
      } else {
        balls[i].opacity -= 0.01;
      }
    }
    setTimeout(function () {
      return smoothCallback(n + 1);
    }, 1000 / 144);
  };
  const callback = async () => {
    // 공 날라갔다가 돌아왔을때
    isCallback = true;
    /* block, addball update */
    blocks = blocks.map((v) => {
      v.t++;
      v.Y_min += v.h;
      v.Y_max += v.h;
      return v;
    });
    addBalls = addBalls.map((v, n) => {
      v.t++;
      if (v.t == 7) {
        addBalls.splice(n, 1);
        shouldAdd++;
      }
      return v;
    });
    /* //block, addball update */
    /* block cnt */
    let cnt = 0;
    let getrandomcnt = Math.floor(Math.random() * 10) + 1;
    if (turn < 10) {
      cnt = Math.floor(Math.random() * 2) + 1 == 1 ? 1 : 2;
    } else {
      if (getrandomcnt <= 3) {
        cnt = 1 + (Math.floor(turn / 10) > 2 ? 2 : Math.floor(turn / 10));
      } else if (getrandomcnt <= 6) {
        cnt = 2 + (Math.floor(turn / 10) > 2 ? 2 : Math.floor(turn / 10));
      } else {
        cnt = 3 + (Math.floor(turn / 10) > 2 ? 2 : Math.floor(turn / 10));
      }
    }
    /* //block cnt */
    /* block */
    var bl = [];
    for (let i = 0; i < cnt; i++) {
      let l = Math.floor(Math.random() * 6);
      if (bl.includes(l)) {
        i--;
      } else {
        bl.push(l);
        blocks.push(new Block({ l: l, t: 1, cnt: turn }));
      }
    }
    /* //block */
    /* addvall */
    function recursive() {
      let l = Math.floor(Math.random() * 6);
      if (bl.includes(l)) {
        recursive();
      } else {
        addBalls.push(new AddBall({ l: l, t: 1 }));
      }
    }
    recursive();
    /* //addvall */
    /* ball */
    for (let i = 0, len = balls.length; i < len; i++) {
      balls[i].opacity = 1;
    }
    for (let i = 0; i < shouldAdd; i++) {
      balls.push(new Ball(balls[fbId].x, balls[fbId].y));
    }
    shouldAdd = 0;
    if (blocks.find((f) => f.t == 8)) return end();
    await ballGather();
    // for(var i=0, len= Balls.length; i<len; i++){
    // 	Balls[i].x= Balls[fbId].x;
    // 	Balls[i].y= Balls[fbId].y;
    // }
    /* //ball */
    document.querySelector('.score').innerText = turn;
    document.querySelector('.b').innerText = balls.length;
    isCallback = false;
    fbId = null;
  };
  const ballGather = () => {
    // 공 모으는 애니메이션
    let distance = [];
    let cnt = 10;
    for (let i = 0, len = balls.length; i < len; i++) {
      balls[i].y = balls[fbId].y;
      let dis = fbId == i ? 0 : (balls[fbId].x - balls[i].x) / cnt;
      distance.push(dis);
    }
    return new Promise((res) => {
      function recursive(n) {
        for (let i = 0, len = balls.length; i < len; i++) {
          balls[i].x += distance[i];
        }
        setTimeout(() => {
          if (n < cnt - 1) {
            recursive(n + 1);
          } else {
            for (let i = 0, len = balls.length; i < len; i++) {
              balls[i].x = balls[fbId].x;
            }
            res(true);
          }
        }, 1000 / 60);
      }
      recursive(0);
    });
  };
  const end = () => {
    // 게임 끝났을때
    isEnd = true;
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, W, H);
    soundManager.play('gameOver');
  };
  const ballsShoot = (i, t) => {
    return new Promise((res) => {
      balls[i].isShoot = true;
      soundManager.play('ballLaunch');
      setTimeout(
        () => {
          return res(i);
        },
        (1000 / 144) * t
      );
    });
  };
  const touchToMouseDown = (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
      };
      onMouseDown(mouseEvent);
    }
  };
  const touchToMouseMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
      };
      onMouseMove(mouseEvent);
      if (mouseState === 1) {
        e.preventDefault();
      }
    }
  };
  const touchToMouseUp = (e) => {
    // touchend는 changedTouches 사용
    const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    if (touch) {
      const mouseEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
      };
      onMouseUp(mouseEvent);
    }
  };
  /* //function */
  window.onload = async () => {
    balls.push(new Ball());
    blocks.push(new Block({ l: 0, t: 1, cnt: turn }));
    blocks.push(new Block({ l: 5, t: 1, cnt: turn }));
    addBalls.push(new AddBall({ l: 1, t: 1 }));
    fb = balls[0];
    eve();
    display();

    await Promise.all([
      soundManager.loadSound('ballLaunch', 'sounds/ball-launch.mp3'),
      soundManager.loadSound('brickDestruction', 'sounds/brick-destruction.mp3'),
      soundManager.loadSound('brickHit', 'sounds/brick-hit.mp3'),
      soundManager.loadSound('coin', 'sounds/coin.mp3'),
      soundManager.loadSound('gameOver', 'sounds/game-over.mp3'),
    ]);
  };
})();
