(ns cube.webgl-cube)

(if-not Detector/webgl
  (Detector/addGetWebGLMessage))

(defn init []
  (let [camera (let [c (THREE/PerspectiveCamera.)]
                 (do (set! (.-fov    c) 75)
                     (set! (.-aspect c) (/ window/innerWidth window/innerHeight))
                     (set! (.-near   c) 1)
                     (set! (.-far    c) 10000)
                     (set! (.-position c) (THREE/Vector3. 0 0 1000))
                     c))

        geometry (THREE/CubeGeometry. 200 200 200)

        material (THREE/MeshBasicMaterial. (js* "{ color: 0xff0000, wireframe: true }"))

        mesh (THREE/Mesh. geometry material)

        scene (let [s (THREE/Scene.)]
                (do (.add s mesh)
                    s))

        renderer (let [r (THREE/WebGLRenderer.)]
                   (do (.setSize r window/innerWidth, window/innerHeight)
                       (.appendChild document/body (.-domElement r))
                       r))]
    (vector renderer scene camera mesh)))

(defn animate [[renderer scene camera mesh]]
  (do (window/requestAnimationFrame cube/webgl-cube/animate)
      (.render renderer scene camera)))

(defn ^:export main []
  (animate (init))
  (.write js/document "<p>WebGL Cube</p>"))
