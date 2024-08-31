//=========================================================================
// minimalist DOM helpers
//=========================================================================

var Dom = {
  get: function(id) {
    return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id);
  },
  set: function(id, html) {
    Dom.get(id).innerHTML = html;
  },
  on: function(ele, type, fn, capture) {
    Dom.get(ele).addEventListener(type, fn, capture);
  },
  un: function(ele, type, fn, capture) {
    Dom.get(ele).removeEventListener(type, fn, capture);
  },
  show: function(ele, type) {
    Dom.get(ele).style.display = (type || 'block');
  },
  blur: function(ev) {
    ev.target.blur();
  },
  addClassName: function(ele, name) {
    Dom.toggleClassName(ele, name, true);
  },
  removeClassName: function(ele, name) {
    Dom.toggleClassName(ele, name, false);
  },
  toggleClassName: function(ele, name, on) {
    ele = Dom.get(ele);
    var classes = ele.className.split(' ');
    var n = classes.indexOf(name);
    on = (typeof on == 'undefined') ? (n < 0) : on;
    if (on && (n < 0))
      classes.push(name);
    else if (!on && (n >= 0))
      classes.splice(n, 1);
    ele.className = classes.join(' ');
  },
  storage: window.localStorage || {}
}

//=========================================================================
// general purpose helpers (mostly math)
//=========================================================================

var Util = {

  timestamp:        function()                  { return new Date().getTime();                                    },
  toInt:            function(obj, def)          { if (obj !== null) { var x = parseInt(obj, 10); if (!isNaN(x)) return x; } return Util.toInt(def, 0); },
  toFloat:          function(obj, def)          { if (obj !== null) { var x = parseFloat(obj);   if (!isNaN(x)) return x; } return Util.toFloat(def, 0.0); },
  limit:            function(value, min, max)   { return Math.max(min, Math.min(value, max));                     },
  randomInt:        function(min, max)          { return Math.round(Util.interpolate(min, max, Math.random()));   },
  randomChoice:     function(options)           { return options[Util.randomInt(0, options.length-1)];            },
  percentRemaining: function(n, total)          { return (n%total)/total;                                         },
  accelerate:       function(v, accel, dt)      { return v + (accel * dt);                                        },
  interpolate:      function(a,b,percent)       { return a + (b-a)*percent                                        },
  easeIn:           function(a,b,percent)       { return a + (b-a)*Math.pow(percent,2);                           },
  easeOut:          function(a,b,percent)       { return a + (b-a)*(1-Math.pow(1-percent,2));                     },
  easeInOut:        function(a,b,percent)       { return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        },
  exponentialFog:   function(distance, density) { return 1 / (Math.pow(Math.E, (distance * distance * density))); },

  increase:  function(start, increment, max) { // with looping
    var result = start + increment;
    while (result >= max)
      result -= max;
    while (result < 0)
      result += max;
    return result;
  },

  project: function(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
    p.camera.x     = (p.world.x || 0) - cameraX;
    p.camera.y     = (p.world.y || 0) - cameraY;
    p.camera.z     = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth/p.camera.z;
    p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
    p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
    p.screen.w     = Math.round(             (p.screen.scale * roadWidth   * width/2));
  },

  overlap: function(x1, w1, x2, w2, percent) {
    var half = (percent || 1)/2;
    var min1 = x1 - (w1*half);
    var max1 = x1 + (w1*half);
    var min2 = x2 - (w2*half);
    var max2 = x2 + (w2*half);
    return ! ((max1 < min2) || (min1 > max2));
  }

}

//=========================================================================
// POLYFILL for requestAnimationFrame
//=========================================================================

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback, element) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}

//=========================================================================
// GAME LOOP helpers
//=========================================================================

var Game = {
  run: function(options) {
    Game.loadImages(options.images, function(images) {
      options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble

      Game.setKeyListener(options.keys);

      var canvas = options.canvas, // canvas render target is provided by caller
          update = options.update,  // method to update game logic is provided by caller
          render = options.render,  // method to render the game is provided by caller
          step   = options.step,    // fixed frame step (1/fps) is specified by caller
          stats  = options.stats,   // stats instance is provided by caller
          now    = null,
          last   = Util.timestamp(),
          dt     = 0,
          gdt    = 0;

      function frame() {
        now = Util.timestamp();
        dt = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
        gdt = gdt + dt;
        while (gdt > step) {
          gdt = gdt - step;
          update(step);
        }
        render();
        last = now;
        requestAnimationFrame(frame, canvas);
      }
      frame(); // lets get this party started
      Game.playMusic();
    });
  },

  playMusic: function() {
    var music = Dom.get('music');
    music.loop = true;
    music.volume = 0.05; // shhhh! annoying music!
    music.muted = (Dom.storage.muted === "true");

    // Ensure play is called after a user gesture
    document.getElementById('startGameButton').addEventListener('click', function() {
      music.play().catch(function(error) {
        console.error("Failed to play music:", error);
      });
    });

    Dom.toggleClassName('mute', 'on', music.muted);
    Dom.on('mute', 'click', function() {
      Dom.storage.muted = music.muted = !music.muted;
      Dom.toggleClassName('mute', 'on', music.muted);
    });
  },

  //---------------------------------------------------------------------------

  loadImages: function(names, callback) { // load multiple images and callback when ALL images have loaded
    var result = [];
    var count  = names.length;

    var onload = function() {
      if (--count == 0)
        callback(result);
    };

    for(var n = 0 ; n < names.length ; n++) {
      var name = names[n];
      result[n] = document.createElement('img');
      Dom.on(result[n], 'load', onload);
      result[n].src = "images/" + name + ".png";
    }
  },

  //---------------------------------------------------------------------------

  setKeyListener: function(keys) {
    var onkey = function(keyCode, mode) {
      var n, k;
      for(n = 0 ; n < keys.length ; n++) {
        k = keys[n];
        k.mode = k.mode || 'up';
        if ((k.key == keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
          if (k.mode == mode) {
            k.action.call();
          }
        }
      }
    };
    Dom.on(document, 'keydown', function(ev) { onkey(ev.keyCode, 'down'); } );
    Dom.on(document, 'keyup',   function(ev) { onkey(ev.keyCode, 'up');   } );
  },

  //---------------------------------------------------------------------------

  stats: function(parentId, id) { // construct mr.doobs FPS counter - along with friendly good/bad/ok message box

    var result = new Stats();
    result.domElement.id = id || 'stats';
    Dom.get(parentId).appendChild(result.domElement);

    var msg = document.createElement('div');
    msg.style.cssText = "border: 2px solid gray; padding: 5px; margin-top: 5px; text-align: left; font-size: 1.15em; text-align: right;";
    msg.innerHTML = "Your canvas performance is ";
    Dom.get(parentId).appendChild(msg);

    var value = document.createElement('span');
    value.innerHTML = "...";
    msg.appendChild(value);

    setInterval(function() {
      var fps   = result.current();
      var ok    = (fps > 50) ? 'good'  : (fps < 30) ? 'bad' : 'ok';
      var color = (fps > 50) ? 'green' : (fps < 30) ? 'red' : 'gray';
      value.innerHTML       = ok;
      value.style.color     = color;
      msg.style.borderColor = color;
    }, 5000);
    return result;
  },

  //---------------------------------------------------------------------------

  playMusic: function() {
    var music = Dom.get('music');
    music.loop = true;
    music.volume = 0.05; // shhhh! annoying music!
    music.muted = (Dom.storage.muted === "true");
    music.play();
    Dom.toggleClassName('mute', 'on', music.muted);
    Dom.on('mute', 'click', function() {
      Dom.storage.muted = music.muted = !music.muted;
      Dom.toggleClassName('mute', 'on', music.muted);
    });
  }

}

//=========================================================================
// canvas rendering helpers
//=========================================================================

var Render = {

  polygon: function(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  },


  //---------------------------------------------------------------------------

  segment: function(ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {

    var r1 = Render.rumbleWidth(w1, lanes),
        r2 = Render.rumbleWidth(w2, lanes),
        l1 = Render.laneMarkerWidth(w1, lanes),
        l2 = Render.laneMarkerWidth(w2, lanes),
        lanew1, lanew2, lanex1, lanex2, lane;
    
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);
    
    Render.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
    Render.polygon(ctx, x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
    Render.polygon(ctx, x1-w1,    y1, x1+w1, y1, x2+w2, y2, x2-w2,    y2, color.road);
    
    if (color.lane) {
      lanew1 = w1*2/lanes;
      lanew2 = w2*2/lanes;
      lanex1 = x1 - w1 + lanew1;
      lanex2 = x2 - w2 + lanew2;
      for(lane = 1 ; lane < lanes ; lanex1 += lanew1, lanex2 += lanew2, lane++)
        Render.polygon(ctx, lanex1 - l1/2, y1, lanex1 + l1/2, y1, lanex2 + l2/2, y2, lanex2 - l2/2, y2, color.lane);
    }
    
    Render.fog(ctx, 0, y1, width, y2-y1, fog);
  },

  //---------------------------------------------------------------------------

  background: function(ctx, backgroundImage, width, height, layer, rotation, offset) {
    rotation = rotation || 0;
    offset   = offset   || 0;

    var imageW = layer.w;
    var imageH = layer.h;

    var sourceX = Math.floor(imageW * rotation);
    var sourceY = 0;
    var sourceW = Math.min(imageW, imageW - sourceX);
    var sourceH = imageH;

    var destX = 0;
    var destY = offset;
    var destW = Math.floor(width * (sourceW / imageW));
    var destH = height;

    ctx.drawImage(backgroundImage, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
    if (sourceW < imageW) {
        ctx.drawImage(backgroundImage, 0, sourceY, imageW - sourceW, sourceH, destW - 1, destY, width - destW, destH);
    }
},


  //---------------------------------------------------------------------------

  sprite: function(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
    // Scale for projection AND relative to roadWidth (for tweakUI)
    var destW = (sprite.width * scale * width / 2) * (SPRITES.SCALE * roadWidth);
    var destH = (sprite.height * scale * width / 2) * (SPRITES.SCALE * roadWidth);

    destX = destX + (destW * (offsetX || 0));
    destY = destY + (destH * (offsetY || 0));

    var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
    if (clipH < destH) {
        // Check if the sprite is part of a spritesheet or a standalone image
        if (sprite.x !== undefined && sprite.y !== undefined && sprite.w !== undefined && sprite.h !== undefined) {
            // Sprite from spritesheet
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
        } else {
            // Standalone sprite image
            ctx.drawImage(sprite, destX, destY, destW, destH - clipH);
        }
    }
},


  //---------------------------------------------------------------------------

  player: function(ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
    var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1, 1]);
    var sprite;
    if (steer < 0)
      sprite = (updown > 0) ? playerUphillLeftSprite : playerLeftSprite;
    else if (steer > 0)
      sprite = (updown > 0) ? playerUphillRightSprite : playerRightSprite;
    else
      sprite = playerStraightSprite;  // Use the new player straight sprite image

    var destW = (sprite.width * scale * width / 2) * (SPRITES.SCALE * roadWidth);
    var destH = (sprite.height * scale * width / 2) * (SPRITES.SCALE * roadWidth);

    destX = destX + (destW * -0.5);
    destY = destY + (destH * -1) + bounce;

    var clipH = Math.max(0, destY + destH - height);
    if (clipH < destH) {
      ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height - (sprite.height * clipH / destH), destX, destY, destW, destH - clipH);
    }
  },

  //---------------------------------------------------------------------------

  fog: function(ctx, x, y, width, height, fog) {
    if (fog < 1) {
      ctx.globalAlpha = (1-fog)
      ctx.fillStyle = COLORS.FOG;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  },

  rumbleWidth:     function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(6,  2*lanes); },
  laneMarkerWidth: function(projectedRoadWidth, lanes) { return projectedRoadWidth/Math.max(32, 8*lanes); }

}

//=============================================================================
// RACING GAME CONSTANTS
//=============================================================================

// Get the game style from the global variable set in index.html
var gameStyle = window.gameStyle || "grassland"; // Default to grassland if undefined

var COLORS = {};

switch (gameStyle) {
    case 'grassland':
        COLORS = {
            SKY: '#72D7EE',
            TREE: '#005108',
            FOG: '#005108',
            LIGHT: { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC' },
            DARK: { road: '#696969', grass: '#009A00', rumble: '#BBBBBB' },
            START: { road: 'white', grass: 'white', rumble: 'white' },
            FINISH: { road: 'black', grass: 'black', rumble: 'black' }
        };
        break;
    case 'desert':
        COLORS = {
            SKY: '#FFCC33',
            TREE: '#A67B5B',
            FOG: '#A67B5B',
            LIGHT: { road: '#E0C68C', grass: '#E6D3A3', rumble: '#D4B284', lane: '#F3E3BD' },
            DARK: { road: '#D4B284', grass: '#E0C68C', rumble: '#E6D3A3' },
            START: { road: '#FFEBB7', grass: '#E6D3A3', rumble: '#FFEBB7' },
            FINISH: { road: '#A67B5B', grass: '#A67B5B', rumble: '#A67B5B' }
        };
        break;
    case 'ice':
        COLORS = {
            SKY: '#B3E5FC',
            TREE: '#81D4FA',
            FOG: '#81D4FA',
            LIGHT: { road: '#A7C4D7', grass: '#B3E5FC', rumble: '#81D4FA', lane: '#D9EAF2' },
            DARK: { road: '#81D4FA', grass: '#A7C4D7', rumble: '#B3E5FC' },
            START: { road: '#D9EAF2', grass: '#B3E5FC', rumble: '#D9EAF2' },
            FINISH: { road: '#4FC3F7', grass: '#4FC3F7', rumble: '#4FC3F7' }
        };
        break;

    case 'midnight':
        COLORS = {
          SKY: '#0A0A2A',
          TREE: '#005108',
          FOG: '#005108',
          LIGHT: { road: '#3A3A3A', grass: '#004400', rumble: '#333333', lane: '#888888' },
          DARK: { road: '#2F2F2F', grass: '#003300', rumble: '#666666' },
          START: { road: 'white', grass: 'white', rumble: 'white' },
          FINISH: { road: 'black', grass: 'black', rumble: 'black' }
        };
        break;
      
    
    default:
        COLORS = {
            SKY: '#72D7EE',
            TREE: '#005108',
            FOG: '#005108',
            LIGHT: { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC' },
            DARK: { road: '#696969', grass: '#009A00', rumble: '#BBBBBB' },
            START: { road: 'white', grass: 'white', rumble: 'white' },
            FINISH: { road: 'black', grass: 'black', rumble: 'black' }
        };
        break;
}

console.log("Current game style:", gameStyle); // You can remove this after testing

var KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
  A:     65,
  D:     68,
  S:     83,
  W:     87
};


var BACKGROUND = {
  HILLS: { x:   5, y:   5, w: 1280, h: 480 },
  SKY:   { x:   5, y: 495, w: 1280, h: 480 },
  TREES: { x:   5, y: 985, w: 1280, h: 480 }
};

var SPRITES = {
  PLAYER_STRAIGHT:        { x: 1085, y:  480, w:   284, h:   41 }
};

SPRITES.SCALE = 0.3 * (1/SPRITES.PLAYER_STRAIGHT.w) // the reference sprite width should be 1/3rd the (half-)roadWidth


