(ns cube.simple-cube)

(defn init []
  (let [camera (let [c (THREE/PerspectiveCamera. 75
                                                 (/ window/innerWidth window/innerHeight)
                                                 1
                                                 10000)]
                 (do (set! (.-position c) (THREE/Vector3. 0 0 1000))
                     c))

        geometry (THREE/CubeGeometry. 200 200 200)

        material (THREE/MeshBasicMaterial. (js* "{ color: 0xffff00, wireframe: true }"))

        mesh (THREE/Mesh. geometry material)

        scene (let [s (THREE/Scene.)]
              (do (.add s mesh)
                  s))

        renderer (let [r (THREE/CanvasRenderer.)]
                   (do (.setSize r window/innerWidth, window/innerHeight)
                       (.appendChild document/body (.-domElement r))
                       r))]
    (fn animate []
      (do (window/requestAnimationFrame animate)
          (set! (.-x (.-rotation mesh)) (+ 0.01 (.-x (.-rotation mesh))))
          (set! (.-y (.-rotation mesh)) (+ 0.02 (.-y (.-rotation mesh))))
          (.render renderer scene camera)))))

(defn ^:export main []
  ((init))
  (.write js/document "<p>Simple Cube</p>"))