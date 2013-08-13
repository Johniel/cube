(ns cube.simple-cube)

(def camera (let [c (THREE/PerspectiveCamera.)]
              (do (set! (.-fov    c) 75)
                  (set! (.-aspect c) (/ window/innerWidth window/innerHeight))
                  (set! (.-near   c) 1)
                  (set! (.-far    c) 10000)
                  (set! (.-position c) (THREE/Vector3. 0 0 1000))
                  c)))

(def geometry (THREE/CubeGeometry. 200 200 200))

(def material (THREE/MeshBasicMaterial. (js* "{ color: 0xff0000, wireframe: true }")))

(def mesh (THREE/Mesh. geometry material))

(def scene (let [s (THREE/Scene.)]
              (do (.add s mesh)
                  s)))

(def renderer (let [r (THREE/CanvasRenderer.)]
                 (do (.setSize r window/innerWidth, window/innerHeight)
                     (.appendChild document/body (.-domElement r))
                     r)))

(defn animate []
  (do (window/requestAnimationFrame cube/simple-cube/animate)
      (set! (.-x (.-rotation mesh)) (+ 0.01 (.-x (.-rotation mesh))))
      (set! (.-y (.-rotation mesh)) (+ 0.02 (.-y (.-rotation mesh))))
      (.render renderer scene camera)))

(defn ^:export main []
  (animate)
  (.write js/document "<p>Simple Cube</p>"))
