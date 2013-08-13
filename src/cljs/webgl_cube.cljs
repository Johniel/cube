(ns cube.webgl-cube)

(if-not Detector/webgl
  (Detector/addGetWebGLMessage))

(defn init []
  (let [camera (let [c (THREE/PerspectiveCamera. 75
                                                 (/ window/innerWidth window/innerHeight)
                                                 1
                                                 10000)]
                 (do (set! (.-position c) (THREE/Vector3. 0 0 1000))
                     c))

        geometry (THREE/CubeGeometry. 200 200 200)

        material (THREE/MeshBasicMaterial. (js* "{ color: 0xff0000, wireframe: true }"))

        mesh (THREE/Mesh. geometry material)

        scene (let [s (THREE/Scene.)]
                (do (.add s mesh)
                    s))

        renderer (let [r (THREE/WebGLRenderer. (js* "{antialias:  false,
                                                      clearColor: 0x333333,
                                                      clearAlpha: 1,
                                                      alpha:      false}"))]
                   (do (.setSize r window/innerWidth, window/innerHeight)
                       (.appendChild document/body (.-domElement r))
                       r))]
    (fn animate []
      (let [t (* 0.001 (Date/now))]
        (do (window/requestAnimationFrame animate)
            (set! (.-x (.-rotation mesh)) (* 2.0 t))
            (set! (.-y (.-rotation mesh)) (* 0.9 t))
            (.render renderer scene camera))))))

(defn ^:export main []
  ((init))
  (.write js/document "<p>WebGL Cube</p>"))
