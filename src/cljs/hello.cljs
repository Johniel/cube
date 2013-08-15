(ns cube.hello)

(defn ^:export main []
  (.write js/document "<p>Hello</p>"))
