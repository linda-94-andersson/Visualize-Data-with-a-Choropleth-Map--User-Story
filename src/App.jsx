import { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./App.css";

function App() {
  const [educationData, setEducationData] = useState([]);
  const [countyData, setCountyData] = useState([]);
  const educationProRef = useRef(null);

  useEffect(() => {
    // Fetch the education data and county data using Axios
    axios
      .all([
        axios.get(
          "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
        ),
        axios.get(
          "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
        ),
      ])
      .then(
        axios.spread((educationResponse, countyResponse) => {
          setEducationData(educationResponse.data);
          setCountyData(countyResponse.data);
          educationProRef.current = educationResponse.data.dataEducation;
          createChoroplethMap(educationResponse.data, countyResponse.data);
        })
      )
      .catch((error) => console.error(error));
  }, []);

  const createChoroplethMap = (educationData, countyData) => {
    // Constants for the dimensions of the SVG and the margins
    const margin = { top: 80, right: 25, bottom: 30, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create scales for color and legend
    const colorScale = d3
      .scaleQuantize()
      .domain([
        d3.min(educationData, (d) => d.bachelorsOrHigher),
        d3.max(educationData, (d) => d.bachelorsOrHigher),
      ])
      .range(d3.schemeBlues[5]);

    const legendScale = d3
      .scaleLinear()
      .domain([
        d3.min(educationData, (d) => d.bachelorsOrHigher),
        d3.max(educationData, (d) => d.bachelorsOrHigher),
      ])
      .range([0, width / 2]);

    // Create the SVG element and append a group to it
    const svg = d3
      .select("#choropleth")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create the counties
    svg
      .selectAll(".county")
      .data(topojson.feature(countyData, countyData.objects.counties).features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("fill", (d) =>
        colorScale(educationData.find((e) => e.fips === d.id).bachelorsOrHigher)
      )
      .attr("data-fips", (d) => d.id)
      .attr(
        "data-education",
        (d) => educationData.find((e) => e.fips === d.id).bachelorsOrHigher
      )
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    // Create the legend
    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width / 4}, ${height + 40})`);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(13)
      .tickValues(colorScale.range().map((d) => colorScale.invertExtent(d)[0]));

    legend
      .selectAll("rect")
      .data(colorScale.range())
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * (width / 10))
      .attr("y", 0)
      .attr("width", width / 10)
      .attr("height", 13)
      .attr("fill", (d) => d);

    legend.call(legendAxis);
  };

  const handleMouseOver = (event) => {
    const tooltip = d3.select("#tooltip");
    const d = d3.select(event.target).data()[0];
    tooltip.style("display", "inline");
    tooltip.style("opacity", 0.9);
    tooltip.style("left", event.pageX + 10 + "px");
    tooltip.style("top", event.pageY + 10 + "px");
    console.log(d, " this is d")
    tooltip.html(`FIPS ${d.dataFips}: Education ${d.dataEducation}`);
  };

  const handleMouseOut = () => {
    d3.select("#tooltip").style("display", "none");
  };

  return (
    <div>
      <h1 id="title">United States Educational Attainment</h1>
      <p id="description">
        {`Percentage of adults age 25 and older with a bachelor's degree or higher
        (2010-2014)`}
      </p>
      <svg id="choropleth"></svg>
      <div id="tooltip" style={{ display: "none" }}></div>
    </div>
  );
}

export default App;
