/*	- imgEditor -
 *	A JavaScript/HTML5 canvas photo editor.
 *	All effects are in effects/ folder. 
 *	
 *	If no canvas ID is set, it will apply to all canvas elements found.
 *		- jQuery
 */
var imgEditor = function(canvasID){
	
	var imgEditor = {
		// Config variables
		strokeResolution : 5,		// Pixel side of squares for resolution
		minRadius : 5,				// Minimum radius
		randRadius : 5,				// Max random radius extra
		randPosition : 2,			// Max point position deviation
		innerMargin : 20			// Margin to each side of the canvas
	};
	
	
	//
	if(canvasID == null) canvasID = 'canvas';
	if($(canvasID).length == 0){
		alert('File undefined');
		return false;
	}
	// Canvas
	imgEditor.canvas = {
		elem : $(canvasID),
		ctx : $(canvasID)[0].getContext("2d"),
		WIDTH : $(canvasID).width(),
		HEIGHT : $(canvasID).height(),
		canvasMinX : $(canvasID).offset().left,
		canvasMaxX : imgEditor.canvasMinX + imgEditor.WIDTH,
		canvasMinY : $(canvasID).offset().top,
		canvasMaxY : imgEditor.canvasMinY + imgEditor.HEIGHT
	};
	
	imgEditor.mouse = {
		x : imgEditor.canvas.WIDTH/2,
		y : imgEditor.canvas.HEIGHT/2
	};
	
	imgEditor.clear = function() {
		imgEditor.canvas.ctx.clearRect(0, 0, imgEditor.canvas.WIDTH, imgEditor.canvas.HEIGHT);
	};
	
	imgEditor.img = {
		i : new Image(),
		x : 0,
		y : 0
	};
	
	imgEditor.load = function(src, callback){
		imgEditor.img.i.src = src;
		imgEditor.img.i.onload = function(){
			// Resize canvas to match image size (If bigger)
			var newH = imgEditor.canvas.WIDTH, newW = imgEditor.canvas.HEIGHT;
			if(imgEditor.img.i.width > imgEditor.canvas.WIDTH) newW = imgEditor.img.i.width;
			if(imgEditor.img.i.height > imgEditor.canvas.HEIGHT) newH = imgEditor.img.i.height;
			// Store current drawn canvas
			//var cache = new Image;
			//cache.src = imgEditor.save();
			imgEditor.resizeCanvas(newH,newW);
			// Redraw the saved data
			//imgEditor.drawImage(cache);
			imgEditor.drawImage(imgEditor.img.i);
			callback.call();
		};
	};
	
	imgEditor.drawImage = function(img){
		imgEditor.canvas.ctx.drawImage(img, 0, 0);
	};
	
	imgEditor.background = function(color){
		// Now add the white canvas to its right
		imgEditor.canvas.ctx.fillStyle=color;
		imgEditor.canvas.ctx.fillRect(0, 0, imgEditor.canvas.WIDTH, imgEditor.canvas.HEIGHT);
	};
	
	imgEditor.resizeCanvas = function(h,w) {
		imgEditor.canvas.WIDTH = w;
		imgEditor.canvas.HEIGHT = h;
		
		imgEditor.canvas.elem.attr('width',imgEditor.canvas.WIDTH);
		imgEditor.canvas.elem.attr('height',imgEditor.canvas.HEIGHT);
	};
	
	imgEditor.circle = function(x,y,rad,color){
		// Circulo
		imgEditor.canvas.ctx.fillStyle = color;
		imgEditor.canvas.ctx.beginPath();
		imgEditor.canvas.ctx.arc(x,y,rad,0,Math.PI*2,true);
		imgEditor.canvas.ctx.closePath();
		imgEditor.canvas.ctx.fill();
	};
		
	imgEditor.newColor = function(){
		if(!imgEditor.colorful) return '#fff';
		return '#'+Math.round(0xffffff * Math.random()).toString(16);
	};
	
	imgEditor.mouseMove = function(e) {
		imgEditor.mouse.s.x = Math.max( Math.min( e.pageX - imgEditor.mouse.p.x, 40 ), -40 );
		imgEditor.mouse.s.y = Math.max( Math.min( e.pageY - imgEditor.mouse.p.y, 40 ), -40 );
		
		imgEditor.mouse.p.x = e.pageX - imgEditor.canvas.canvasMinX;
		imgEditor.mouse.p.y = e.pageY - imgEditor.canvas.canvasMinY;
	};
	
	// --------- IMAGE FUNCTIONS ----------- //
	
	// Average values
	imgEditor.avg = [];
	imgEditor.generated = false; // Flag to know if averages have been calculated.
	
	imgEditor.generateAvg = function(callback){
		imgEditor.avg = []; // clear current avg
		
		// Get samples from the image with the resolution set in strokeResolution
		var pix = imgEditor.canvas.ctx.getImageData(0, 0, imgEditor.canvas.WIDTH, imgEditor.canvas.HEIGHT), auxAvg, points;
		//
		for(var y = 0; y < pix.height; y += imgEditor.strokeResolution){
			for(var x = 0; x < pix.width; x += imgEditor.strokeResolution){
				auxAvg = [0, 0, 0];	// Avg
				points = 0;	// Pixels measured for avg (strokeResolution^2)
				for(var x1 = 0; x1 < imgEditor.strokeResolution;	x1++){
					if(x+x1 > pix.width) break;
					for(var y1 = 0; y1 < imgEditor.strokeResolution;	y1++){
						if(y+y1 > pix.height) break;
						// I now have all needed pointers
						// Get the index inside pix array
						var pixIndex = ((y+y1)*pix.width+x+x1)*4;
						auxAvg[0] += pix.data[pixIndex];
						auxAvg[1] += pix.data[pixIndex+1];
						auxAvg[2] += pix.data[pixIndex+2];
						points++;
						//console.log(pix.data[pixIndex]);
						//debugger;
					}
				}
				// Now get final average
				auxAvg[0] = Math.round(auxAvg[0]/points);
				auxAvg[1] = Math.round(auxAvg[1]/points);
				auxAvg[2] = Math.round(auxAvg[2]/points);
				// Store
				imgEditor.avg.push(auxAvg);
			}
		}
		console.log('Sampling done');
		console.log(imgEditor.avg);
		// Set flag
		imgEditor.generated = true;
		callback.call();
	};
	
	imgEditor.applyEffect = function(effect, callback){
		require(["effects/"+effect], function(){
			var obj = imgEditor;
			if(!imgEditor.generated){
				imgEditor.generateAvg(function(){
					exec(obj);
					callback.call();
				});
			}else{
				exec(obj);
				callback.call();
			}
		});
	};
	
	imgEditor.save = function(){
		return imgEditor.canvas.elem.get(0).toDataURL();
	};
	
	imgEditor.zoom = function(scale){
		var h = $(imgEditor.canvas.elem).height(),
			w = $(imgEditor.canvas.elem).width();
			
		// Resize via CSS, the canvas scale is maintained
		imgEditor.canvas.elem.css({
			height: h * scale,
			width: w * scale,
			marginTop: -h*scale/2,
			marginLeft: -w*scale/2
		});
	};

	return imgEditor;
};