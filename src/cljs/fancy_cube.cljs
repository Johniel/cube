(ns cube.fancy-cube
  (:use [cljs.core.async :only [chan <! >! put! alts! alts!! timeout]])
  (:use-macros [cljs.core.async.macros :only [go alt!]]))

(if-not Detector/webgl
  (Detector/addGetWebGLMessage))

(def triangles  160000)
(def chunk-size 21845)
(def n 800)
(def n2 (/ n 2))
(def d 12)
(def d2 (/ d 2))

(defn make-renderer []
  (let [r (THREE/WebGLRenderer. (cljs.core/clj->js {"antialias"  false
                                                    "clearColor" 0x333333
                                                    "clearAlpha" 1
                                                    "alpha"      false}))]
    (do (.setSize r window/innerWidth window/innerHeight)
        (set! (.-gammaInput r) true)
        (set! (.-gammaOutput r) true)
        (set! (.-physicallyBasedShading r) true)
        (.appendChild (.getElementById js/document "container") (.-domElement r))
        r)))

(defn make-material []
  (THREE/MeshPhongMaterial. (cljs.core/clj->js {"color"        0xaaaaaa
                                                "ambient"      0xaaaaaa
                                                "specular"     0xffffff
                                                "shininess"    250
                                                "side"         THREE.DoubleSide
                                                "vertexColors" THREE.VertexColors})))

(defn make-geometry []
  (js/makeGeometryObject  triangles n n2 d d2 chunk-size))

(defn make-mesh []
  (THREE/Mesh. (make-geometry) (make-material)))

(defn make-camera []
  (let [c (THREE/PerspectiveCamera. 27
                                    (/ window/innerWidth window/innerHeight)
                                    1
                                    3500)]
    (do (set! (.-position c) (THREE/Vector3. 0 0 2750))
        c)))

(defn make-fog []
  (THREE/Fog. 0x050505 2000 3500))

(defn make-scene [mesh]
  (let [s (THREE/Scene.)
        light2 (let [l (THREE/DirectionalLight. 0xffffff 1.5)]
                 (do (.set (.-position l) 0 -1 0)
                     l))
        light1 (let [l (THREE/DirectionalLight. 0xffffff 0.5)]
                 (do (.set (.-position l) 1 1 1)
                     l))]
    (do (set! (.-fog s) (make-fog))
        (.add s light1)
        (.add s light2)
        (.add s mesh)
        (.add s (THREE/AmbientLight. 0x444444))
        s)))

(def input-chan
  (let [c (chan)]
    (.addEventListener js/document "keydown" #(put! c (.-keyCode %)))
    c))

(defn init []
  (let [camera (make-camera)
        geometry (THREE/CubeGeometry. 200 200 200)
        material (make-material)
        mesh (make-mesh)
        scene (make-scene mesh)
        renderer (make-renderer)
        t (* 0.001 (Date/now))]
    (fn animate []
      (go (let [[key-code ch] (alts! [input-chan (timeout 1)])]
            (let [x 0.01
                  y (if (= input-chan ch) 0.2 0.02)]
            (window/requestAnimationFrame animate)
            (set! (.-x (.-rotation mesh)) (+ x (.-x (.-rotation mesh))))
            (set! (.-y (.-rotation mesh)) (+ y (.-y (.-rotation mesh))))
            (.render renderer scene camera)))))))

(defn ^:export main []
  ((init))
  (.write js/document "<p>Fancy Cube</p>"))
