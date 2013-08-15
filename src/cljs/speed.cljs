(ns cube.speed
  (:use [cljs.core.async :only [chan <! >! put! alts! alts!! timeout]])
  (:use-macros [cljs.core.async.macros :only [go alt!]]))

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
    (.addEventListener js/document "keydown" #(>! c (.-keyCode %)))
    c))

(defn ^:export change-speed []
  (go (let [[key-code ch] (alts! [input-chan (timeout 1)])]
        (if (= ch input-chan)
          (case key-code
                38 (reset! speed-y (+ 0.1 @speed-y))
                40 (reset! speed-y (- 0.1 @speed-y))
                39 (reset! speed-x (+ 0.1 @speed-x))
                37 (reset! speed-x (- 0.1 @speed-x))
                nil)))))
