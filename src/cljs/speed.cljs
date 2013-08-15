(ns cube.speed
  (:use [cljs.core.async :only [chan <! put! !>]])
  (:use-macros [cljs.core.async.macros :only [go]]))

(def speed-x (atom 2.0))
(def speed-y (atom 0.9))

(defn ^:export get-speed-x [] (deref speed-x))
(defn ^:export get-speed-y [] (deref speed-y))

(def left-key  37)
(def up-key    38)
(def right-key 39)
(def down-key  40)

(def input-chan
  (let [c (chan)]
    (.addEventListener js/document "keydown" #(put! c (.-keyCode %)))
    c))

(defn ^:export main []
  (go (loop []
        (let [key-code (<! input-chan)]
          (case key-code
                up-key    (reset! speed-y (+ 0.5 speed-y))
                down-key  (reset! speed-y (- 0.5 speed-y))
                right-key (reset! speed-x (+ 0.5 speed-x))
                left-key  (reset! speed-x (- 0.5 speed-x)))
       (recur)))))
