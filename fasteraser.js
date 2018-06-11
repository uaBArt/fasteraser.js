OWOP.tool.addToolObject(new OWOP.tool.class('uaBArt\'s Eraser', OWOP.cursors.erase, OWOP.fx.player.NONE, false, function(tool) {
    let queue = [];
    tool.extra.start = null;
    tool.extra.end = null;
    tool.extra.clicking = false;
    tool.setFxRenderer(function(fx, ctx, time) {
        if (!fx.extra.isLocalPlayer) return 1;
        var z = OWOP.camera.zoom;
        var x = fx.extra.player.x;
        var y = fx.extra.player.y;
        var fxx = (Math.floor(x / 16 / 16) * 16 - OWOP.camera.x) * z;
        var fxy = (Math.floor(y / 16 / 16) * 16 - OWOP.camera.y) * z;
        var oldlinew = ctx.lineWidth;
        ctx.lineWidth = 1;
        if (tool.extra.end) {
            var s = tool.extra.start;
            var e = tool.extra.end;
            var x = (Math.floor(s[0] / 16) * 16 - OWOP.camera.x) * z + 0.5;
            var y = (Math.floor(s[1] / 16) * 16 - OWOP.camera.y) * z + 0.5;
            var w = (Math.floor(e[0] / 16) - Math.floor(s[0] / 16)) * 16;
            var h = (Math.floor(e[1] / 16) - Math.floor(s[1] / 16)) * 16;
            ctx.beginPath();
            ctx.rect(x, y, w * z, h * z);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#FFFFFF";
            ctx.stroke();
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.globalAlpha = 0.25 + Math.sin(time / 500) / 4;
            ctx.fillStyle = "#000000";
            ctx.fill();
            ctx.setLineDash([]);
            ctx.lineWidth = oldlinew;
            return 0
        } else {
            ctx.beginPath();
            ctx.moveTo(0, fxy + 0.5);
            ctx.lineTo(window.innerWidth, fxy + 0.5);
            ctx.moveTo(fxx + 0.5, 0);
            ctx.lineTo(fxx + 0.5, window.innerHeight);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#FFFFFF";
            ctx.stroke();
            ctx.setLineDash([3]);
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = oldlinew;
            return 1
        }
    });

    function fillChunk(chunkX, chunkY, c) {
        const color = c[2] << 16 | c[1] << 8 | c[0];
        queue.unshift([chunkX, chunkY, c])
    };

    function tick() {
        for (var painted = 0; painted < 60 && queue.length; painted++) {
            var current = queue.pop();
            if (!OWOP.net.protocol.clearChunk(current[0], current[1], current[2])) {
                queue.push(current);
                break
            }
        }
        if (!queue.length) {
            tool.setEvent('tick', null);
            return
        }
    }
    tool.setEvent('deselect', function(mouse) {
        queue = [];
        tool.setEvent('tick', null)
    });
    tool.setEvent('mousedown mousemove', function(mouse, event) {
        var s = tool.extra.start;
        var e = tool.extra.end;
        const isInside = () => mouse.tileX >= s[0] && mouse.tileX < e[0] && mouse.tileY >= s[1] && mouse.tileY < e[1];
        if ((mouse.buttons === 1 || mouse.buttons === 2) && !tool.extra.end) {
            tool.extra.start = [mouse.tileX, mouse.tileY];
            tool.extra.clicking = mouse.buttons;
            tool.setEvent('mousemove', function(mouse, event) {
                if (tool.extra.start && (mouse.buttons === 1 || mouse.buttons === 2)) {
                    tool.extra.end = [mouse.tileX, mouse.tileY];
                    return 1
                }
            });
            const finish = () => {
                tool.setEvent('mousemove mouseup deselect', null);
                var s = tool.extra.start;
                var e = tool.extra.end;
                if (e) {
                    if (s[0] === e[0] || s[1] === e[1]) {
                        tool.extra.start = null;
                        tool.extra.end = null
                    }
                    if (s[0] > e[0]) {
                        var tmp = e[0];
                        e[0] = s[0];
                        s[0] = tmp
                    }
                    if (s[1] > e[1]) {
                        var tmp = e[1];
                        e[1] = s[1];
                        s[1] = tmp
                    }
                }
                clear(s, e, tool.extra.clicking);
                tool.setEvent('tick', tick);
                tool.extra.start = null;
                tool.extra.end = null;
                tool.extra.clicking = null
            };
            tool.setEvent('deselect', finish);
            tool.setEvent('mouseup', function(mouse, event) {
                if (!(mouse.buttons & 1)) {
                    finish()
                }
            })
        }
        var clear = function(start, end, buttons) {
            var sx = Math.floor(start[0] / 16);
            var sy = Math.floor(start[1] / 16);
            var ex = Math.floor(end[0] / 16);
            var ey = Math.floor(end[1] / 16);
            for (var j = sy; j < ey; j++) {
                for (var i = sx; i < ex; i++) {
                    if (buttons === 1) {
                        fillChunk(i, j, OWOP.player.selectedColor)
                    } else if (buttons === 2) {
                        fillChunk(i, j, [255, 255, 255])
                    }
                }
            }
        }
    })
}));