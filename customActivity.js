1define(["postmonger"], function (Postmonger) {
2  "use strict";
3
4  var connection = new Postmonger.Session();
5  var payload = {};
6  var lastStepEnabled = false;
7  var steps = [
8    // initialize to the same value as what's set in config.json for consistency
9    { label: "Step 1", key: "step1" },
10    { label: "Step 2", key: "step2" },
11    { label: "Step 3", key: "step3" },
12    { label: "Step 4", key: "step4", active: false },
13  ];
14  var currentStep = steps[0].key;
15
16  $(window).ready(onRender);
17
18  connection.on("initActivity", initialize);
19  connection.on("requestedTokens", onGetTokens);
20  connection.on("requestedEndpoints", onGetEndpoints);
21
22  connection.on("clickedNext", onClickedNext);
23  connection.on("clickedBack", onClickedBack);
24  connection.on("gotoStep", onGotoStep);
25
26  function onRender() {
27    // JB will respond the first time 'ready' is called with 'initActivity'
28    connection.trigger("ready");
29
30    connection.trigger("requestTokens");
31    connection.trigger("requestEndpoints");
32
33    // Disable the next button if a value isn't selected
34    $("#select1").change(function () {
35      var message = getMessage();
36      connection.trigger("updateButton", {
37        button: "next",
38        enabled: Boolean(message),
39      });
40
41      $("#message").html(message);
42    });
43
44    // Toggle step 4 active/inactive
45    // If inactive, wizard hides it and skips over it during navigation
46    $("#toggleLastStep").click(function () {
47      lastStepEnabled = !lastStepEnabled; // toggle status
48      steps[3].active = !steps[3].active; // toggle active
49
50      connection.trigger("updateSteps", steps);
51    });
52  }
53
54  function initialize(data) {
55    if (data) {
56      payload = data;
57    }
58
59    var message;
60    var hasInArguments = Boolean(
61      payload["arguments"] &&
62        payload["arguments"].execute &&
63        payload["arguments"].execute.inArguments &&
64        payload["arguments"].execute.inArguments.length > 0
65    );
66
67    var inArguments = hasInArguments
68      ? payload["arguments"].execute.inArguments
69      : {};
70
71    $.each(inArguments, function (index, inArgument) {
72      $.each(inArgument, function (key, val) {
73        if (key === "message") {
74          message = val;
75        }
76      });
77    });
78
79    // If there is no message selected, disable the next button
80    if (!message) {
81      showStep(null, 1);
82      connection.trigger("updateButton", { button: "next", enabled: false });
83      // If there is a message, skip to the summary step
84    } else {
85      $("#select1")
86        .find("option[value=" + message + "]")
87        .attr("selected", "selected");
88      $("#message").html(message);
89      showStep(null, 3);
90    }
91  }
92
93  function onGetTokens(tokens) {
94    // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
95    // console.log(tokens);
96  }
97
98  function onGetEndpoints(endpoints) {
99    // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
100    // console.log(endpoints);
101  }
102
103  function onClickedNext() {
104    if (
105      (currentStep.key === "step3" && steps[3].active === false) ||
106      currentStep.key === "step4"
107    ) {
108      save();
109    } else {
110      connection.trigger("nextStep");
111    }
112  }
113
114  function onClickedBack() {
115    connection.trigger("prevStep");
116  }
117
118  function onGotoStep(step) {
119    showStep(step);
120    connection.trigger("ready");
121  }
122
123  function showStep(step, stepIndex) {
124    if (stepIndex && !step) {
125      step = steps[stepIndex - 1];
126    }
127
128    currentStep = step;
129
130    $(".step").hide();
131
132    switch (currentStep.key) {
133      case "step1":
134        $("#step1").show();
135        connection.trigger("updateButton", {
136          button: "next",
137          enabled: Boolean(getMessage()),
138        });
139        connection.trigger("updateButton", {
140          button: "back",
141          visible: false,
142        });
143        break;
144      case "step2":
145        $("#step2").show();
146        connection.trigger("updateButton", {
147          button: "back",
148          visible: true,
149        });
150        connection.trigger("updateButton", {
151          button: "next",
152          text: "next",
153          visible: true,
154        });
155        break;
156      case "step3":
157        $("#step3").show();
158        connection.trigger("updateButton", {
159          button: "back",
160          visible: true,
161        });
162        if (lastStepEnabled) {
163          connection.trigger("updateButton", {
164            button: "next",
165            text: "next",
166            visible: true,
167          });
168        } else {
169          connection.trigger("updateButton", {
170            button: "next",
171            text: "done",
172            visible: true,
173          });
174        }
175        break;
176      case "step4":
177        $("#step4").show();
178        break;
179    }
180  }
181
182  function save() {
183    var name = $("#select1").find("option:selected").html();
184    var value = getMessage();
185
186    // 'payload' is initialized on 'initActivity' above.
187    // Journey Builder sends an initial payload with defaults
188    // set by this activity's config.json file.  Any property
189    // may be overridden as desired.
190    payload.name = name;
191
192    payload["arguments"].execute.inArguments = [{ message: value }];
193
194    payload["metaData"].isConfigured = true;
195
196    connection.trigger("updateActivity", payload);
197  }
198
199  function getMessage() {
200    return $("#select1").find("option:selected").attr("value").trim();
201  }
202});
