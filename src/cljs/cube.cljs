(ns cube.cube)

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
   (string? x) x
   (keyword? x) (name x)
   (map? x) (.-strobj (reduce (fn [m [k v]]
                                (assoc m (clj->js k) (clj->js v))) {} x))
   (coll? x) (apply array (map clj->js x))
   :else x))

(if-not Detector/webgl
  (Detector/addGetWebGLMessage))

(defn calc-aspect []
  (/ window/innerWidth window/innerHeight))

(def camera (let [c (THREE/PerspectiveCamera.)]
              (do (set! (.-fav    c) 27)
                  (set! (.-aspect c) (calc-aspect))
                  (set! (.-near   c) 1)
                  (set! (.-far    c) 3500)
                  (.set (.-position c) (THREE/Vector3. 0 0 2750))
                  c)))

(def light1 (let [l (THREE/DirectionalLight. 0xffffff 0.5)]
              (do (.set (.-position l) 1 1 1)
                  l)))

(def light2 (let [l (THREE/DirectionalLight. 0xffffff 1.5)]
              (do (.set (.-position l) 0 -1 0)
                  l)))

(def triangles  16000)
(def chunk-size 21845)
(def n 400)
(def n2 (/ n 2))
(def d 24)
(def d2 (/ d 2))

(defn make-random-triangle []
  (let [x (- (* n (.random js/Math)) n2)
        y (- (* n (.random js/Math)) n2)
        z (- (* n (.random js/Math)) n2)
        ax (- (* d (.random js/Math)) d2)
        ay (- (* d (.random js/Math)) d2)
        az (- (* d (.random js/Math)) d2)
        bx (- (* d (.random js/Math)) d2)
        by (- (* d (.random js/Math)) d2)
        bz (- (* d (.random js/Math)) d2)
        cx (- (* d (.random js/Math)) d2)
        cy (- (* d (.random js/Math)) d2)
        cz (- (* d (.random js/Math)) d2)
        pa (THREE/Vector3. ax ay az)
        pb (THREE/Vector3. bx by bz)
        pc (THREE/Vector3. cx cy cz)
        a->b (THREE/Vector3.)
        c->b (THREE/Vector3.)]
    (do (.subVectors a->b pa pb)
        (.subVectors c->b pc pb)
        (.normalize c->b)
        (let [nx (.-x c->b)
              ny (.-y c->b)
              nz (.-z c->b)
              vx (+ 0.5 (/ x n))
              vy (+ 0.5 (/ y n))
              vz (+ 0.5 (/ z n))
              c (THREE/Color. vx vy vz)]
          {"position" [ax ay az bx by bz cx cy cz]
           "normal"   [nx ny nz nx ny nz nx ny nz]
           "color"    [(.-r c) (.-g c) (.-b c)
                       (.-r c) (.-g c) (.-b c)
                       (.-r c) (.-g c) (.-b c)]}))))

;;
(defn make-indecies []
  (let [len (* triangles 3)]
    (map #(mod % (* 3 chunk-size)) (range 0 len))))

(defn make-attr []
  (->> 10
       (range 0)
       (map (fn [_] (make-random-triangle)))
       (reduce (fn [a b] {"position" (concat (get a "position") (get b "position"))
                          "normal"   (concat (get a "normal")   (get b "normal"))
                          "color"    (concat (get a "color")    (get b "color"))}))
       ((fn [m] {"index"    {"itemSize" 3
                             "numItems" (* triangles 3)
                             "array"    (js/Uint16Array. (apply array (make-indecies)))}
                 "position" {"itemSize" 3
                             "numItems" (* triangles 3 3)
                             "array"    (js/Float32Array. (apply array (get m "position")))}
                 "normal"   {"itemSize" 3
                             "numItems" (* triangles 3 3)
                             "array"    (js/Float32Array. (apply array (get m "normal")))}
                 "color"    {"itemSize" 3
                             "numItems" (* triangles 3 3)
                             "array"    (js/Float32Array. (apply array (get m "color")))}}))))

(defn make-offsets []
  (map (fn [n] {"start" (* n 3 chunk-size)
                "index" (* n 3 chunk-size)
                "count" (* 3 (.min js/Math chunk-size (- triangles (* n chunk-size))))})
       (range 0 (/ triangles chunk-size))))

(def geometry (let [g (THREE/BufferGeometry.)]
                (set! (.-attributes g) (clj->js (make-attr)))
                (set! (.-offset     g) (clj->js make-offsets))
                (.computeBoundingSphere g)
                g))

(def scene (let [s (THREE/Scene.)]
             (set! (.-fog s) (THREE/Fog. 0x050505 2000 3500))
             (.add s light1)
             (.add s light2)
             (.add s mesh)
             (.add s (THREE/AmbientLight. 0x444444))
             s))

(def renderer (let [r (THREE/WebGLRenderer. (clj->js {"antialias"  false
                                                      "clearColor" 0x333333
                                                      "clearAlpha" 1
                                                      "alpha"      false}))]
                (do (.setSize r window/innerWidth
                              window/innerHeight)
                    (.setClearColor r (.-color (.-fog scene)) 1)
                    (set! (.-gammaInput r) true)
                    (set! (.-gammaOutput r) true)
                    (set! (.-physicallyBasedShading r) true)
                    r)))


(def material (THREE/MeshPhongMaterial. (clj->js {"color"     0xaaaaaa
                                                  "ambient"   0xaaaaaa
                                                  "specular"  0xffffff
                                                  "shininess" 250
                                                  "side"      THREE/DoubleSide
                                                  "vertexColors" THREE/VertexColors})))

(def mesh (THREE/Mesh. geometry material))

(def container (let [c (.getElementById js/document "container")]
                 (do (.appendChild c (.-domElement renderer))
                     c)))

(defn render []
  (let [time (* 0.001 (Date/now))]
    nil))

(defn onWindowResize []
  (do (set! (.-aspect camera) (calc-aspect))
      (.updateProjectionMatrix camera)
      (.setSize renderer window/innerWidth window/innerHeight)))

(defn animate []
  (do (window/requestAnimationFrame animate)
      (render)))

(defn ^:export main []
  (animate)
  (.write js/document "<p>Hello, ClojureScript Compiler!</p>"))
