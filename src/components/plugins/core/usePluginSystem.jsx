/**
 * usePluginSystem — React hook
 * Initializes the plugin loader once on app startup and exposes plugin state.
 */
import { useState, useEffect, useRef } from "react";
import { loadPlugins } from "./PluginLoader";
import { gameAPI } from "./GameAPI";
import { PLUGINS } from "../PluginRegistry";

export function usePluginSystem(nation) {
  const [loaded, setLoaded]   = useState(false);
  const [results, setResults] = useState([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Inject the nation data provider into GameAPI
    if (nation) {
      gameAPI._setNationDataProvider(() => nation);
    }

    const res = loadPlugins(PLUGINS);
    setResults(res);
    setLoaded(true);
  }, []);

  // Update nation data provider when nation changes
  useEffect(() => {
    if (nation) gameAPI._setNationDataProvider(() => nation);
  }, [nation]);

  const registeredBuildings  = loaded ? gameAPI.getRegisteredBuildings()  : [];
  const registeredResources  = loaded ? gameAPI.getRegisteredResources()  : [];
  const registeredLanguages  = loaded ? gameAPI.getRegisteredLanguages()  : [];

  return { loaded, results, registeredBuildings, registeredResources, registeredLanguages, gameAPI };
}