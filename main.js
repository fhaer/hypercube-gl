/*\
|*| math helpers
\*/


function multAll (things) {
  return things.reduce(function (acc, m) { return math.multiply(acc,m) })
}


/*\
|*| THREE helpers
\*/


function proj3(arr) {
  // very simple projection for now
  return new THREE.Vector3(arr[0],arr[1],arr[2]);
}


/*\
|*| Main
\*/


function setupHypercubeCallback( dt, dim, simShimInst ) {
  return function (hypercube) {
    // unpack
    var rotMats = hypercube.rotationMatrices;
    var edges = hypercube.edges;
    // adjust cube to be centered on 0
    var verts = hypercube.vertices.map(function(v) {
      return v.map(function (component) {
        return component - 0.5;
      })
    });

    // generate a random ish rotation matrix
    var M = multAll( rotMats.map(function (m) {
      return rotMats[ Math.floor(Math.random()*rotMats.length) ];
    }));

    ////////////////// THREE stuff

    var material = new THREE.LineBasicMaterial({
    	color: 0x7777ff
    });

    var simShimObjects = edges.map(function (edge,i) {
      var e0 = edge[0], e1 = edge[1]; // vertex pair for an edge

      var geometry = new THREE.Geometry();
      geometry.dynamic = true;
      geometry.vertices.push(
      	proj3( verts[e0] ),
      	proj3( verts[e1] )
      );

      var edgeLine = new THREE.Line( geometry, material );
      edgeLine.frustumCulled = false;

      return {
        update: function () {
          if (i==0) {
            verts = verts.map(function (v) {
              return math.multiply(M, v);
            });
          }

          edgeLine.geometry.vertices = edge.map(function (ei) {
            return proj3( verts[ei] );
          });

          edgeLine.geometry.verticesNeedUpdate = true;
        },
        threeObj: edgeLine
      };
    });

    simShimObjects.map(function (sso) { simShimInst.addObject(sso) });
    // simShimInst.setPaused(false);
  }
}


function reset(dt, dim) {
  ss.kill();
  hypercube.ports.requestDimension.send( [dt, dim] );
  isPaused = false;
  ss.setPaused(isPaused);
}


// == INIT == //

var ss = new SimShim(
  document.getElementById("plot"),
  {
    "cameraPosn": [ 3, 3, 3 ],
    "orbitTarget": [ 0, 0, 0 ],
    "clearColor": "#161616"
  }
);
ss.start();

var dt = 5*0.00025,
    dim = 4,
    cb = setupHypercubeCallback(dt, dim, ss),
    hypercube = Elm.worker(Elm.Hypercube, { requestDimension:[0, 0] })
    ;
var isPaused = false;
hypercube.ports.responseDimension.subscribe(cb);
reset(dt, dim);


// == Listen == //


function resetFromHtml() {
  var dimVal = document.getElementById("reset-dim-input").value,
      dimNum = parseInt(dimVal)
      ;
  var speedVal = document.getElementById("reset-speed-input").value,
      speedNum = parseInt(speedVal)
      ;
  if (dimNum <= 1) {
    alert("Dimensions: Please enter a number greater than 1");
    return;
  }
  if (speedNum < 1 || speedNum > 100) {
    alert("Speed: Please enter a number in [0-100]");
    return;
  }
  var dtNum = speedNum*0.00025;
  reset(dtNum, dimNum);
}

function pauseFromHtml() {
  isPaused = !isPaused;
  ss.setPaused(isPaused);
}

document.getElementById("reset").addEventListener('click', resetFromHtml, false);

document.getElementById("pause").addEventListener('click', pauseFromHtml, false);
