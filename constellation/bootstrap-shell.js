const setC11nCookie860 = (staticContentServer, token, appAlias) => {
    // investigate missing B2S JWT
    if (!token || token.length===0) console.error(`bootstrap-shell.setC11nCookie860() missing or zero length token`);

    // service path cleanup - see swagger - parse out infinity version from path - last segment
    const idx = staticContentServer.lastIndexOf('/', staticContentServer.length-2);
    const c11Seturl = `${staticContentServer.substring(0,idx)}/v860/${appAlias}/setc11ncookie`;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", c11Seturl, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = () => { };
    xhr.send(`token=${token}`);
}


const rootContainerWithHybrid = {
    type: 'RootContainer',
    config: {
        renderingMode: 'hybrid'
    },
    children: [{
        "type": "HybridViewContainer",
        "config": {
            "routingInfo": "@ROUTING_INFO",
            "name": "primary",
            "contextName": "app",
        },
        children: []
    }
    ]
};

const buildSemanticUrl = (constellationPathInfo, noPortal, restServer, viewName) => {

    let isNoPortalParam = false;
    if ("true" === noPortal) {
        isNoPortalParam = true;
    }

    let caseOrPageName = null;
    let caseWork = null;
    if (constellationPathInfo) {
        if (constellationPathInfo.startsWith("/")) {
            constellationPathInfo = constellationPathInfo.substring(1);
        }
        const pathTokens = constellationPathInfo.split("/");
        if (pathTokens.length > 0 && pathTokens[0]) {
            caseOrPageName = pathTokens[0];
        }
        if (pathTokens.length > 1 && pathTokens[1]) {
            caseWork = pathTokens[1];
        }
    } else {
        isNoPortalParam = false;
    }

    let constellationUrl = restServer;
    if (caseOrPageName) {
        constellationUrl = constellationUrl + "/" + caseOrPageName;
    }
    if (caseWork) {
        constellationUrl = constellationUrl + "/" + caseWork;
    }
    if (isNoPortalParam) {
        constellationUrl = constellationUrl + "?noPortal=true";
        if (caseWork && viewName) {
            constellationUrl = constellationUrl + "&view=" + viewName;
        }
    }

    return constellationUrl;
}

let containerCount = 0;

const loadView = (targetDom, viewMetadata, preLoadComponents = [], runtimeParams, portalTarget, styleSheetTarget, containerTargetName ) => {
    const containerName = containerTargetName || `mashup${++containerCount}`
    const rootContainer = {
        type: 'RootContainer',
        config: {
            renderingMode: 'portal',
            viewConfig: '@P .viewConfig',
            name: containerName
        },
    }
    window.PCore.getRuntimeParamsAPI().setRuntimeParams(runtimeParams);
    constellationCore.loadRootComponent(targetDom, rootContainer, preLoadComponents, portalTarget, styleSheetTarget).then(() => {
        return constellationCore.updateStoreWithUiRoot(viewMetadata, containerName);
    });
}

const loadPortal = (targetDom, portalName, preLoadComponents = [], containerTargetName) => {
  const containerName = containerTargetName || `portal${++containerCount}`
    const rootContainer = {
        type: 'RootContainer',
        config: {
            viewConfig: '@P .viewConfig',
            renderingMode: 'portal',
            skeleton: 'LoadingComponent',
            name: containerName
        },
    }
    preLoadComponents.push(rootContainer.config.skeleton);
    constellationCore.loadRootComponent(targetDom, rootContainer, preLoadComponents).then(() => {
        return constellationCore.loadPortalView(portalName, containerName);
    });
}

const loadComponent = (targetDom, componentMetadata, preLoadComponents) => {
    return constellationCore.loadComponent(componentMetadata, targetDom, preLoadComponents);
}

/**
 * Loads the view with the viewName under the targetDom
 * @param {String} targetDom
 * @param {String} viewName
 */
const loadViewByName = (targetDom, viewName, portalName, viewClass, additionalComponents, portalTarget, styleSheetTarget, containerTargetName) => {
    const containerName = containerTargetName || `mashup${++containerCount}`;
    const rootContainer = {
        type: 'RootContainer',
        config: {
            viewConfig: '@P .viewConfig',
            renderingMode: 'view',
            name: containerName
        }
    }
    constellationCore.loadRootComponent(targetDom, rootContainer, additionalComponents, portalTarget, styleSheetTarget).then(() => {
        return constellationCore.loadViewByName(viewName, portalName, viewClass, containerName);
    });
}

const loadMashup = (targetDom, usePegaMashupStyling = true) => {
    let rootMashUp = {
        type: 'RootContainer',
        config: {
            renderingMode: 'noPortal'
        },
        children: [{
            type: "ViewContainer",
            "config": {
                "routingInfo": "@ROUTING_INFO",
                "name": "primary"
            }
        }]
    }

    // NOTE: We CANNOT force other consumers (ex: Quasar Mashup) to use this styling
    if (usePegaMashupStyling) {
        const targetDomElement = document.getElementsByTagName(targetDom)[0] && document.getElementsByTagName(targetDom)[0].parentNode;
        if (targetDomElement) {
            targetDomElement.innerHTML += `
                                      <style id='portal-less-styles'>
                                        app-root.mashup > .case-view, app-root.mashup > .page-view { min-height: 0px !important; }
                                      </style>
                                  `;
        }
    }

    constellationCore.loadRootComponent(targetDom, rootMashUp, ["View", "ViewContainer"])

    /* US-350587 : Support the resize desktop action in mashup */
    if (window.parent !== window) {
        import(`${constellationCore.PCoreInstance.getAssetLoader().getStaticServerUrl()}constellation-mashup-bridge.js`).then(mod => {
            mod.mashup.init({
                "resizing": "stretch"
            });
        });
    }
}

const loadCase = (targetDom, caseId, preLoadComponents = [], portalTarget, styleSheetTarget) => {
    preLoadComponents.push("HybridViewContainer", "View");
    constellationCore.loadRootComponent(targetDom, rootContainerWithHybrid, preLoadComponents, portalTarget, styleSheetTarget).then(() => {
        return constellationCore.getCaseApi().openCase(caseId, 'app', 'primary');
    });
}


const createCase = (targetDom, caseId, preLoadComponents = [], portalTarget, styleSheetTarget) => {
    preLoadComponents.push("HybridViewContainer", "View");
    constellationCore.loadRootComponent(targetDom, rootContainerWithHybrid, preLoadComponents, portalTarget, styleSheetTarget).then(() => {
        return constellationCore.getCaseApi().createCase(caseId, 'app', 'primary');
    });
}

const loadAssignment = (targetDom, assignmentId, preLoadComponents = [], portalTarget, styleSheetTarget) => {
    preLoadComponents.push("HybridViewContainer", "View");
    constellationCore.loadRootComponent(targetDom, rootContainerWithHybrid, preLoadComponents, portalTarget, styleSheetTarget).then(() => {
        return constellationCore.getCaseApi().openAssignment(assignmentId, 'app', 'primary');
    });
}

const initCoreConfig = config => {
    const { routingInfo,
        actionModel,
        serviceConfig,
        additionalHeaders,
        tokens,
        semanticUrl,
        noPortal,
        timezone,
        noHistory,
        viewName,
        theme,
        restServerConfig,
        dynamicLoadComponents = true,
        dynamicSemanticUrl = true,
        dynamicSetCookie = true,
        enableRouting = true,
        locale,
        environmentInfo,
        remoteCaseMapping = {}
    } = config;
    const { appAlias, googleMapKey, staticContentServer, contextPath } = serviceConfig;

    let restServer = location.origin;
    let behaviorOverrides = {};     // Used below to set/check Mashup settings that will change bootstrap behavior

    // config.restServerConfig can be specified to override the default rest server
    if (undefined !== restServerConfig) {
        // Mashup (Quasar) usage - use provided override in restServerConfig
        restServer = restServerConfig;
    }

    if (contextPath) {
        restServer = `${restServer}${contextPath}`;
    }
    if (appAlias) {
        restServer = `${restServer}/${appAlias}`;
    }

    // Set up behaviorOverrides as specified in config for Mashup (Quasar) usage
    //  Note that, for normal use, dynamicSemanticUrl, dynamicLoadComponents,
    //  and dynamicSetCookie default to true
    if (dynamicSemanticUrl === true) {
        // Standard usage - no override
        const semUrl = buildSemanticUrl(semanticUrl, noPortal, restServer, viewName);
        // Do not push history state for bridge cases in infinity
        if (!noHistory && semUrl) {
            history.pushState({}, "home", semUrl);
        }
    } else {
        // Mashup (Quasar) usage
        let redirectUrl = window.location.href;
        if (redirectUrl.indexOf("?") > 0) {
            redirectUrl = redirectUrl.substring(0, redirectUrl.indexOf("?"));
            history.pushState({}, "home", redirectUrl);
        }
        // make as override, so npm-core/src/router/app-router.js doesn't create semantic url
        behaviorOverrides.dynamicSemanticUrl = false;
    }

    if (dynamicLoadComponents !== true) {
        // Mashup (Quasar) usage
        behaviorOverrides.dynamicLoadComponents = false;
    }

    // remaining use of appAlias is setting up the calls to the c11n service
    // these calls should not be prepended with any form of additional servlet; app/{app-alias} only. bug-627186
    let appAliasNarrow = null;
    if (appAlias) {
        const idx = appAlias.indexOf ("/app/");
        appAliasNarrow = (idx >= 0) ? appAlias.substring(idx+1) : appAlias;
    }

    // Set cookie for normal usage; don't set cookie for Mashup (Quasar) usage
    if (dynamicSetCookie === true) {
        // Standard usage - no override
        setC11nCookie860(staticContentServer, tokens.C11NB2S, appAliasNarrow);
    }

    constellationCore.enableAppRouting(enableRouting);

    if (Object.keys(behaviorOverrides).length > 0) {
        // set it here, since it came in as false
        PCore.setBehaviorOverrides(behaviorOverrides);
    }

    constellationCore.initStore();

    /* Set Theme overrides to the instance */
    if (theme) PCore.getEnvironmentInfo().setTheme(theme);

    /* Set default headers */
    constellationCore.setFetchDefaultHeaders(additionalHeaders);

    const advRoutingInfo = { ...routingInfo, domain: `${window.location.protocol}//${window.location.host}`, searchParams: window.location.search };
    /* Initialize server config */
    constellationCore.initAppShell(advRoutingInfo, actionModel, { server: restServer });
    constellationCore.setAppAlias(appAliasNarrow);
    constellationCore.setGoogleMapsAPIKey(googleMapKey);
    constellationCore.setStaticServerUrl(staticContentServer, tokens.C11NB2S);
    constellationCore.PCoreInstance.getLocaleUtils().setTimezone(timezone);

    PCore.getEnvironmentInfo().setLocale(locale);
    PCore.getRemoteCaseUtils().setRemoteCaseMapping(remoteCaseMapping);
    window.PCore.getEnvironmentInfo().setEnvironmentInfo(environmentInfo);
}

const importConstellationCore = async (staticContentServer, assets) => {

    const prerequisite = assets["prerequisite"];
    if (prerequisite && prerequisite.length > 0) {
        const corePrerequisite = prerequisite[0];
        const serviceUrl = staticContentServer.endsWith('/') ? `${staticContentServer}prerequisite/${corePrerequisite}` : `${staticContentServer}/prerequisite/${corePrerequisite}`;
        return import(serviceUrl).then(mod => {
            window.constellationCore = mod;
            constellationCore.setStaticServerUrl(staticContentServer);

            /* Set up PCore object (public API used by Nebula) - remove if once code merged in constellationUI repo */
            if (window.constellationCore.PCoreInstance !== undefined) {
                window.PCore = window.constellationCore.PCoreInstance;
            }
            for (let i = 1; i < prerequisite.length; i++) {
                import(`${staticContentServer}prerequisite/${prerequisite[i]}`).then(module => {
                    console.log(module);
                });
            }
        })
    }
    return null;
}

const importExternals = async (assets) => {
    await constellationCore.PCoreInstance.getAssetLoader().loadAssets(assets.externals);
    await constellationCore.PCoreInstance.getAssetLoader().loadAssets(assets.entry);
}

const importAssetsJson = async (staticContentServer) => {
    let randomHash = new Date().getTime(); /* Math.floor(100 + Math.random() * 900); */
    return fetch(`${staticContentServer}lib_asset.json?v=${randomHash}`).then(res => res.json());
}



const bootstrap = async (config) => {

    const { staticContentServer } = config.serviceConfig;
    const assets = await importAssetsJson(staticContentServer);
    await importConstellationCore(staticContentServer, assets);
    initCoreConfig(config);

    await importExternals(assets);
}

const getBootstrapConfig = async (restServerUrl, authorizationHeader) => {
    return fetch(
        `${restServerUrl}/api/application/v2/data_views/D_pxBootstrapConfig`,
        {
            method: "GET",
            headers: new Headers({
                Authorization: authorizationHeader,
            })
        }
    ).then((response) => response.json())
};

const loadRootContainer = (targetDom, preLoadComponents = []) => {
    preLoadComponents.push("HybridViewContainer", "View");
    return constellationCore.loadRootComponent(targetDom, rootContainerWithHybrid, preLoadComponents);
}

const bootstrapWithAuthHeader = async (config, target) => {

    // Adding restServerConfig, dynamicLoadComponents, dynamicSemanticUrl, and dynamicSetCookie needed for Mashup (Quasar) usage
    const {
        restServerUrl,
        authorizationHeader,
        appAlias,
        customRendering = false,
        onPCoreReadyCallback,
        staticContentServerUrl
    } = config;

    let bootRes;
    if (appAlias) {
        bootRes = await getBootstrapConfig(`${restServerUrl}/${appAlias}`, authorizationHeader);
    }
    else {
        bootRes = await getBootstrapConfig(`${restServerUrl}`, authorizationHeader);
    }

    const bootConfig = JSON.parse(bootRes.pyConfigJSON);
    bootConfig.restServerConfig = restServerUrl;
    bootConfig.dynamicSemanticUrl = false;
    bootConfig.enableRouting = false;
    bootConfig.serviceConfig.contextPath = "";
    bootConfig.serviceConfig.appAlias = appAlias;
    bootConfig.additionalHeaders = {
        Authorization: authorizationHeader
    };

    bootConfig.dynamicLoadComponents = !customRendering;
    bootConfig.dynamicSemanticUrl = !customRendering;
    bootConfig.noHistory = true;

    const staticContentServer = staticContentServerUrl || bootConfig.serviceConfig.staticContentServer;
    /**
     * updating bootconfig to make sure staticContentServerUrl is not overriden again through bootConfig
     */
    bootConfig.serviceConfig.staticContentServer = staticContentServer;

    const assets = await importAssetsJson(staticContentServer);
    await importConstellationCore(staticContentServer, assets);
    initCoreConfig(bootConfig);
    if (onPCoreReadyCallback) {
        window.PCore.onPCoreReady(onPCoreReadyCallback);
    }

    if (!customRendering) {
        await importExternals(assets);
        await loadRootContainer(target);
    }
}

export {
    bootstrap,
    loadView,
    loadPortal,
    loadComponent,
    loadMashup,
    loadViewByName,
    loadCase,
    createCase,
    loadAssignment,
    bootstrapWithAuthHeader
}
