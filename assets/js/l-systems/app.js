"use strict";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initial: "F++F++F",
      angle: 60,
      iterations: 2,
      rules: "F: F-F++F-F",
      help: false
    };
    this.changeInitial = this.changeInitial.bind(this);
    this.changeAngle = this.changeAngle.bind(this);
    this.changeIterations = this.changeIterations.bind(this);
    this.changeRules = this.changeRules.bind(this);
    this.sampleRules = this.sampleRules.bind(this);
    this.selectSampleRule = this.selectSampleRule.bind(this);
    this.drawLSystem = this.drawLSystem.bind(this);
    this.toggleHelp = this.toggleHelp.bind(this);
  }

  changeInitial(event) {
    this.setState({
      initial: event.target.value
    });
  }

  changeIterations(event) {
    this.setState({
      iterations: event.target.value
    });
  }

  changeAngle(event) {
    this.setState({
      angle: parseInt(event.target.value)
    });
  }

  changeRules(event) {
    this.setState({
      rules: event.target.value
    });
  }

  sampleRules() {
    return {
      "Koch Snowflake": {
        initial: "F++F++F",
        angle: 60,
        rules: "F: F-F++F-F"
      },
      "Dragon Curve": {
        initial: "FX",
        angle: 90,
        rules: "X: X+YF+\nY: -FX-Y"
      },
      "Sierpinski Triangle": {
        initial: "A",
        angle: 60,
        rules: "A: +B-A-B+\nB: -A+B+A-"
      },
      "Lévy C Curve": {
        initial: "F",
        angle: 45,
        rules: "F: +F--F+"
      },
      "Fern": {
        initial: "++++A",
        angle: 15,
        rules: "A: C[+++++F]C[-----F]C[++++DG]C[------DG]-A\nB: BC\nC: B\nD: C\nF: A\nG: F"
      },
      "Antenna": {
        initial: "++A",
        angle: 18,
        rules: "A: C[C+++++F]C[-----F]C[C+++++DG]C[-----DG]A\nB: BC\nC: B\nD: C\nF: A\nG: F"
      }
    };
  }

  selectSampleRule(event) {
    this.setState(this.sampleRules()[event.target.value]);
  }

  toggleHelp(event) {
    this.setState({
      help: !this.state.help
    });
    event.preventDefault();
    event.stopPropagation();
  }

  componentDidMount() {
    this.drawLSystem();
  }

  componentDidUpdate() {
    this.drawLSystem();
  } // Update the SVG image in response to state change


  drawLSystem() {
    d3.select("svg").selectAll("*").remove();
    var output = calculateLSystem(this.state.initial, this.state.rules, this.state.iterations);
    var tracing = traceLSystem(output, this.state.angle); // Create an SVG path element from the set of turtle positions

    let line = [];

    for (var i = 0; i < tracing.positions.length; i++) {
      if (tracing.positions[i] != null) {
        let char = tracing.positions[i - 1] == null ? "M" : "L";
        line.push(char + tracing.positions[i].x + "," + tracing.positions[i].y);
      }
    }

    d3.select("svg").attr("viewBox", [0, 0, tracing.width, tracing.height].join(" ")).style({
      "height": 100 * tracing.height / tracing.width + "%"
    });
    d3.select("svg").append("path").attr("d", line.join()).attr("stroke", "black").attr("stroke-width", 0.1).attr("fill", "none");
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "four columns"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twelve columns"
    }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: this.toggleHelp
    }, "Instructions"))), /*#__PURE__*/React.createElement("div", {
      id: "help",
      className: "twelve columns",
      style: {
        display: this.state.help ? "block" : "none",
        borderBottom: "1px solid #CCC"
      }
    }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
      href: "https://en.wikipedia.org/wiki/L-system",
      target: "_blank"
    }, "L-Systems"), " are a type of formal grammar which uses recursively-applied character substitution rules to produce strings that can then be translated into fractal images via turtle graphics. Each character in the output string corresponds to an instruction like \"turn right,\" \"turn left,\" or \"move forward.\""), /*#__PURE__*/React.createElement("p", null, "In the widget below, the characters ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "+"), " and ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "-"), " rotate the turtle left and right. The letters ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "A-M"), " move the turtle forward one step, and the letters ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "N-Z"), " are placeholders which don't produce any action, but control the outcome's evolution. ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "["), " and ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace"
      }
    }, "]"), " are special symbols, which push to or pop the turtle's position from an array, causing the turtle to jump from one position to another.")), /*#__PURE__*/React.createElement("div", {
      className: "twelve columns",
      style: {
        borderBottom: "1px solid #CCC"
      }
    }, /*#__PURE__*/React.createElement("label", null, "Select an example L-System or build a custom one below"), /*#__PURE__*/React.createElement("select", {
      onChange: this.selectSampleRule
    }, Object.keys(this.sampleRules()).map(function (value) {
      return /*#__PURE__*/React.createElement("option", {
        key: value,
        value: value
      }, value);
    }))), /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "four columns"
    }, /*#__PURE__*/React.createElement("label", null, "Axiom"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      class: "u-full-width",
      value: this.state.initial,
      onChange: this.changeInitial
    })), /*#__PURE__*/React.createElement("div", {
      className: "four columns"
    }, /*#__PURE__*/React.createElement("label", null, "Angle"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      class: "u-full-width",
      value: this.state.angle,
      min: "0",
      max: "360",
      onChange: this.changeAngle
    })), /*#__PURE__*/React.createElement("div", {
      className: "four columns"
    }, /*#__PURE__*/React.createElement("label", null, "Iterations"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      class: "u-full-width",
      value: this.state.iterations,
      min: "0",
      max: "16",
      onChange: this.changeIterations
    }))), /*#__PURE__*/React.createElement("div", {
      className: "row",
      style: {
        borderBottom: "1px solid #CCC"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "twelve columns"
    }, /*#__PURE__*/React.createElement("label", null, "Rules"), /*#__PURE__*/React.createElement("textarea", {
      class: "u-full-width",
      value: this.state.rules,
      onChange: this.changeRules
    }))), /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twelve columns"
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "https://github.com/alipman88/l-systems",
      target: "_blank"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa fa-github",
      "aria-hidden": "true"
    }), " Source code"))))), /*#__PURE__*/React.createElement("div", {
      className: "eight columns"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        float: "left",
        width: "100%",
        height: "0",
        paddingBottom: "100%"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        left: "0",
        width: "100%",
        marginBottom: "50px",
        overflow: "visible"
      },
      preserveAspectRatio: "none"
    }))));
  }

}

ReactDOM.render( /*#__PURE__*/React.createElement(App, null), document.getElementById('root'));