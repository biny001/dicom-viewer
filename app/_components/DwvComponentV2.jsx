"use client";
import React, { useRef, useState, useEffect } from "react";
import { Ruler, Search, Contrast, RefreshCcw, Menu } from "lucide-react";
import { getDwvVersion, decoderScripts, App } from "dwv";

// Define the decoder scripts
decoderScripts.jpeg2000 = "/assets/dwv/decoders/pdfjs/decode-jpeg2000.js";
decoderScripts["jpeg-lossless"] =
  "/assets/dwv/decoders/rii-mango/decode-jpegloss.js";
decoderScripts["jpeg-baseline"] =
  "/assets/dwv/decoders/pdfjs/decode-jpegbaseline.js";
decoderScripts.rle = "/assets/dwv/decoders/dwv/decode-rle.js";

export const DwViewer = () => {
  const [tools, setTools] = useState({
    ZoomAndPan: {},
    WindowLevel: {},
    Draw: {
      options: ["Ruler"],
    },
  });
  const [selectedTool, setSelectedTool] = useState("Select Tool");
  const [loadProgress, setLoadProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [metaData, setMetaData] = useState({});
  const [orientation, setOrientation] = useState(undefined);
  const dwvApp = useRef(null);

  const getToolIcon = (tool) => {
    switch (tool) {
      case "Scroll":
        return <Menu />;
      case "ZoomAndPan":
        return <Search />;
      case "WindowLevel":
        return <Contrast />;
      case "Draw":
        return <Ruler />;
      default:
        return null;
    }
  };

  const onChangeTool = (tool) => {
    if (dwvApp.current) {
      setSelectedTool(tool);
      dwvApp.current.setTool(tool);
    }
  };

  const onReset = () => {
    if (dwvApp.current) {
      dwvApp.current.resetDisplay();
    }
  };

  const onInputFile = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Reset the app before loading new files
      dwvApp.current.reset();

      // Reset states
      setDataLoaded(false);
      setLoadProgress(0);

      // Load the new files
      dwvApp.current.loadFiles(files);
    }
  };

  const toggleOrientation = () => {
    if (typeof orientation === "undefined") {
      setOrientation("coronal");
    } else {
      setOrientation(
        orientation === "axial"
          ? "coronal"
          : orientation === "coronal"
          ? "sagittal"
          : "axial"
      );
    }
    const config = {
      "*": [
        {
          divId: "layerGroup0",
          orientation: orientation,
        },
      ],
    };

    dwvApp.current.setDataViewConfigs(config);
  };

  useEffect(() => {
    const app = new App();

    app.init({
      dataViewConfigs: {
        "*": [{ divId: "layerGroup0" }],
      },
      tools,
    });

    const handleLoadStart = () => setLoadProgress(0);
    const handleLoadProgress = (event) => {
      setLoadProgress((event.loaded / event.total) * 100);
    };
    const handleRenderEnd = () => {
      setDataLoaded(true);
      if (app.canScroll()) onChangeTool("Scroll");
    };
    const handleLoad = (event) => {
      setMetaData(app.getMetaData(event.dataid));
    };
    const handleLoadEnd = () => setLoadProgress(100);

    // Add event listeners
    app.addEventListener("loadstart", handleLoadStart);
    app.addEventListener("loadprogress", handleLoadProgress);
    app.addEventListener("renderend", handleRenderEnd);
    app.addEventListener("load", handleLoad);
    app.addEventListener("loadend", handleLoadEnd);

    dwvApp.current = app;

    return () => {
      app.removeEventListener("loadstart", handleLoadStart);
      app.removeEventListener("loadprogress", handleLoadProgress);
      app.removeEventListener("renderend", handleRenderEnd);
      app.removeEventListener("load", handleLoad);
      app.removeEventListener("loadend", handleLoadEnd);
    };
  }, [tools]);

  const toolsButtons = Object.keys(tools).map((tool) => (
    <button
      key={tool}
      className={`p-2 m-1 border rounded ${
        !dataLoaded
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-blue-500 text-white"
      }`}
      disabled={!dataLoaded}
      onClick={() => onChangeTool(tool)}
    >
      {getToolIcon(tool)}
    </button>
  ));

  return (
    <div id="dwv" className="p-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded mb-4">
        <div
          className="bg-blue-500 h-2 rounded"
          style={{ width: `${loadProgress}%` }}
        ></div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <div className="flex flex-wrap gap-2">{toolsButtons}</div>
        <button
          className={`p-2 border rounded ${
            dataLoaded
              ? "bg-green-500 text-white"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={!dataLoaded}
          onClick={onReset}
        >
          Reset
        </button>
        <button
          className={`p-2 border rounded ${
            dataLoaded
              ? "bg-yellow-500 text-white"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={!dataLoaded}
          onClick={toggleOrientation}
        >
          Toggle Orientation
        </button>
      </div>

      {/* Layer Group */}
      <div id="layerGroup0" className="layerGroup mt-4">
        <div className="dropBox dropBoxBorder">
          <p>Drag and drop data here or</p>
          <label htmlFor="fileInput" className="dropBoxLink">
            <span>click here</span>
            <input id="fileInput" type="file" multiple onChange={onInputFile} />
          </label>
        </div>
      </div>
    </div>
  );
};
