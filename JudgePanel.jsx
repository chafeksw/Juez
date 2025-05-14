import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Asumiendo que tienes este componente

// Definición de modificadores para Estáticos y PowerMoves
const staticModifiers = [
  { name: "Tuck", value: 0.15 },
  { name: "Tuck Adv", value: 0.3 },
  { name: "Una Pierna", value: 0.4 },
  { name: "Straddle", value: 0.7 },
  { name: "Half", value: 0.8 },
  { name: "Full", value: 1 },
];

const extraPointOptions = [
  { name: "No Extra", value: 0 },
  { name: "+0.25p", value: 0.25 },
  { name: "+0.5p", value: 0.5 },
];

export default function JudgePanel() {
  const [participant, setParticipant] = useState("A");
  const [difficulty, setDifficulty] = useState("amateur");
  
  // Scores directos (solo para combos por ahora)
  const [directScores, setDirectScores] = useState({
    combos: 0,
  });

  const [tricks, setTricks] = useState([]);
  
  // Estado para el truco actual que se está configurando
  const [newTrick, setNewTrick] = useState({
    name: "",
    base: 0,
    clean: 10,
    modifierValue: 1, // Para static/powermove modifier
    extraPointsValue: 0, // Para extras
    powerMoveDetails: {} // Para detalles específicos de powermoves
  });

  const [currentTab, setCurrentTab] = useState("freestyle");
  const [selectedTrickName, setSelectedTrickName] = useState(null);

  // Estados específicos para Statics
  const [selectedStaticModifier, setSelectedStaticModifier] = useState(staticModifiers.find(m => m.name === "Full").value);
  const [selectedStaticExtra, setSelectedStaticExtra] = useState(0);

  // Estados específicos para PowerMoves
  const [pm_category, setPm_category] = useState(null); // 'empuje' o 'tiron'
  const [pm_exercise, setPm_exercise] = useState(null); // 'press', 'pushup', etc.
  const [pm_staticElement, setPm_staticElement] = useState(null); // El estático base para el PM
  const [selectedPowerMoveModifier, setSelectedPowerMoveModifier] = useState(staticModifiers.find(m => m.name === "Full").value);
  const [selectedPowerMoveExtra, setSelectedPowerMoveExtra] = useState(0);
  const [pm_moreThan5Reps, setPm_moreThan5Reps] = useState(false);

  // Estados para Combos
  const [comboAreas, setComboAreas] = useState({
    freestyle: false,
    statics: false,
    powermoves: false,
    balance: false,
  });
  const [comboUnbroken, setComboUnbroken] = useState(false);


  const trickCount = tricks.reduce((acc, t) => {
    const key = `${t.area}-${t.name}`; // Contar por nombre y área para evitar colisiones
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const difficultyMultiplier = {
    beginner: 1.5,
    amateur: 1,
    professional: 0.75,
  }[difficulty];

  const baseStatics = { // Para referencia en PowerMoves
    "Front Lever": 1,
    "Planche": 1.5,
    "Touch": 1.5,
    "Victorian": 1.25,
    "Flag": 0.75,
    "Back Lever": 0.75,
    "Maltese": 2.25,
    "SAT": 2.25,
    "Prayer Planche": 2,
  };
  
  const defaultTricksByTab = {
    freestyle: [
      { name: "360/Tornado", base: 1 },
      { name: "Disloca 360", base: 1.25 },
      { name: "540", base: 1.5 },
      { name: "Geinger", base: 1.5 },
      { name: "Pasavallas", base: 1.5 },
      { name: "PasoFantasma", base: 1.75 },
      // SUPERTRUCOS FREESTYLE
      { name: "720 (Super)", base: 3 },
      { name: "900 (Super)", base: 3 },
      { name: "1080 (Super)", base: 3 },
      { name: "1240 (Super)", base: 3 }, // Asumo que es 1260 o un typo, usando 1240 como en la solicitud
      { name: "Regrab (Super)", base: 3 },
      { name: "Super540 (Super)", base: 3 },
      { name: "Immortal (Super)", base: 3 },
    ],
    statics: [
      // Estáticos normales (base se multiplicará por modificador)
      { name: "Front Lever", base: 1 },
      { name: "Planche", base: 1.5 },
      { name: "Touch", base: 1.5 },
      { name: "Victorian", base: 1.25 },
      { name: "Flag", base: 0.75 },
      { name: "Back Lever", base: 0.75 },
      { name: "Maltese", base: 2.25 },
      { name: "SAT", base: 2.25 },
      { name: "Prayer Planche", base: 2 },
      // SUPERTRUCOS ESTÁTICOS (puntuación fija antes de multiplicador de dificultad)
      { name: "Victorian Cross (Super)", base: 3, isSuper: true },
      { name: "Reverse Planche (Super)", base: 3, isSuper: true },
      { name: "SAT Supino (Super)", base: 3, isSuper: true },
      { name: "Maltese (Avion) (Super)", base: 3, isSuper: true }, // Nombre Avion clarificado
      { name: "One Arm Planche (Super)", base: 3, isSuper: true },
      { name: "Tiger Planche (Super)", base: 3, isSuper: true },
    ],
    powermoves: { // Estructura jerárquica
      empuje: {
        press: Object.keys(baseStatics).map(name => ({ name: `${name} Press`, staticBase: baseStatics[name], originalStatic: name })),
        pushup: Object.keys(baseStatics).map(name => ({ name: `${name} Push up`, staticBase: baseStatics[name], originalStatic: name })),
      },
      tiron: {
        raises: Object.keys(baseStatics).map(name => ({ name: `${name} Raise`, staticBase: baseStatics[name], originalStatic: name })),
        pullups: Object.keys(baseStatics).map(name => ({ name: `${name} Pull up`, staticBase: baseStatics[name], originalStatic: name })),
        // "Press" también está en tirón, podría ser un tipo de press diferente o referir a los mismos estáticos.
        // Por ahora, asumo que se refiere a los mismos estáticos.
        press: Object.keys(baseStatics).map(name => ({ name: `${name} Press (Tirón)`, staticBase: baseStatics[name], originalStatic: name })),
      }
    },
    balance: [
      { name: "Handstand", base: 0.1 },
      { name: "Handstand One Arm", base: 1.25 },
      { name: "One Arm Flag", base: 2 },
      { name: "One Arm Planche", base: 2 }, // Este también es supertruco estático, clarificar si es diferente aquí
      { name: "Dragon Planche", base: 1.75 },
      { name: "One Arm Front Lever", base: 1.5 },
    ],
    combos: [], // Gestionado por UI directa, no por lista de trucos
  };
  
  const descriptions = {
    freestyle: "Creativitat, ús variat de moviments i originalitat.",
    statics: "Elements estàtics. Selecciona un modificador (Tuck, Straddle, Full, etc.) i possibles extres.",
    powermoves: "Moviments explosius. Selecciona categoria, exercici, element estàtic base, modificador i extres. La puntuació per repetició disminueix. Bonus per >5 reps.",
    balance: "Moviments d'equilibri, com handstand o elbow lever.",
    combos: "Puntua segons quants àmbits has tocat (2P c/u), si és unbroken (2P). Penalització per neteja baixa (-1P).",
  };

  const calculateAdjustedScore = (trickDetails) => {
    const {
        base,
        clean,
        area,
        name,
        isSuperStatic = false, // Para supertrucos estáticos que no usan modificador de 0.15-1x
        staticModifierVal = 1, // Multiplicador de Tuck, Straddle, Full, etc.
        extraPts = 0,
        isPowerMove = false,
        powerMoveBaseStaticPoints = 0, // Puntos base del estático en powermove (ya divididos por 3)
    } = trickDetails;

    let score = 0;
    let trickIdForCount = `${area}-${name}`; // Identificador único para contar repeticiones

    if (isPowerMove) {
        score = powerMoveBaseStaticPoints * staticModifierVal;
    } else if (isSuperStatic) { // Supertrucos estáticos tienen base fija, no se multiplican por staticModifierVal (0.15-1)
        score = base;
    } else if (area === "statics") {
        score = base * staticModifierVal;
    } else { // Freestyle, Balance
        score = base;
    }
    
    score *= difficultyMultiplier;
    score *= (clean / 10);
    score += extraPts; // Añadir extras después del multiplicador de dificultad y limpieza

    // Penalización por repetición (aplicable a Freestyle, Balance, y PowerMoves individualmente)
    // No se aplica a supertrucos estáticos o estáticos normales de la misma manera (normalmente no se repiten para puntuar varias veces)
    // La regla original de 66%/33% es para cualquier truco. Para PowerMoves, se especifica explícitamente.
    const count = (trickCount[trickIdForCount] || 0) + 1; // Contamos la ocurrencia actual
    
    if (area === "powermoves" || area === "freestyle" || area === "balance") { // Aplicar reducción por repetición
        if (count === 2) score *= 0.66;
        else if (count === 3) score *= 0.33;
        else if (count > 3) score = 0;
    }
    
    return Math.max(0, score); // Asegurar que el score no sea negativo
  };

  const addTrick = () => {
    let trickToAdd = {
        name: newTrick.name,
        base: newTrick.base,
        clean: newTrick.clean,
        area: currentTab,
        score: 0,
        rawDetailsForDebug: { ...newTrick } // Guardar detalles para depuración
    };

    if (currentTab === "statics") {
        const selectedBaseTrick = defaultTricksByTab.statics.find(t => t.name === newTrick.name);
        if (!selectedBaseTrick) return;

        trickToAdd.isSuperStatic = selectedBaseTrick.isSuper === true;
        trickToAdd.staticModifierVal = selectedStaticModifier;
        trickToAdd.extraPts = selectedStaticExtra;
        trickToAdd.name = `${newTrick.name} (${staticModifiers.find(m => m.value === selectedStaticModifier)?.name || 'Full'}) ${selectedStaticExtra > 0 ? ` (+${selectedStaticExtra}p)` : ''}`;
    } else if (currentTab === "powermoves") {
        if (!pm_category || !pm_exercise || !pm_staticElement) {
            alert("Selecciona categoria, exercici i element estàtic per al PowerMove.");
            return;
        }
        const staticInfo = baseStatics[pm_staticElement.originalStatic];
        if (!staticInfo) return;

        trickToAdd.isPowerMove = true;
        trickToAdd.powerMoveBaseStaticPoints = (staticInfo / 3); // Base del estático dividida por 3
        trickToAdd.staticModifierVal = selectedPowerMoveModifier;
        trickToAdd.extraPts = selectedPowerMoveExtra;
        // Construir nombre descriptivo
        const modifierName = staticModifiers.find(m => m.value === selectedPowerMoveModifier)?.name || 'Full';
        let powerMoveName = `${pm_category} - ${pm_exercise} - ${pm_staticElement.originalStatic} (${modifierName})`;
        if (selectedPowerMoveExtra > 0) powerMoveName += ` (+${selectedPowerMoveExtra}p)`;
        trickToAdd.name = powerMoveName;
        // La cuenta de repeticiones se maneja en calculateAdjustedScore usando el nombre
    }
    // Para Freestyle y Balance, la estructura es más simple y se toma de newTrick directamente.

    const calculatedScore = calculateAdjustedScore(trickToAdd);
    trickToAdd.score = calculatedScore;
    
    setTricks([...tricks, trickToAdd]);
    // Resetear selecciones específicas después de añadir
    setSelectedTrickName(null);
    setNewTrick({ name: "", base: 0, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} }); // Reset general
    setSelectedStaticModifier(staticModifiers.find(m=>m.name==="Full").value);
    setSelectedStaticExtra(0);
    // No reseteamos pm_category, pm_exercise para facilitar añadir varios PM del mismo tipo
    // setPm_staticElement(null); // Quizás resetear el elemento estático específico
    setSelectedPowerMoveModifier(staticModifiers.find(m=>m.name==="Full").value);
    setSelectedPowerMoveExtra(0);

  };
  
  const removeTrick = (index) => {
    setTricks(tricks.filter((_, i) => i !== index));
  };

  const areaScore = (area) => {
    if (area === "combos") {
        return directScores.combos;
    }
    return tricks.filter(t => t.area === area).reduce((sum, trick) => sum + trick.score, 0);
  };

  // Calcular puntuación de combos
  useEffect(() => {
    let comboScore = 0;
    if (comboAreas.freestyle) comboScore += 2;
    if (comboAreas.statics) comboScore += 2;
    if (comboAreas.powermoves) comboScore += 2;
    if (comboAreas.balance) comboScore += 2;
    if (comboUnbroken) comboScore += 2;
    // La penalización se aplica con un botón separado, así que no se resta aquí directamente
    // sino que se modifica `directScores.combos`
    setDirectScores(prev => ({ ...prev, combos: comboScore }));
  }, [comboAreas, comboUnbroken]);
  
  const applyComboPenalty = () => {
    setDirectScores(prev => ({ ...prev, combos: Math.max(0, prev.combos - 1) }));
  };

  // Powermoves > 5 reps bonus
  const powerMoveAreaTotal = areaScore("powermoves") + (pm_moreThan5Reps ? 1 : 0);

  const totalScore = tricks.reduce((sum, trick) => sum + trick.score, 0) + directScores.combos + (pm_moreThan5Reps && currentTab === "powermoves" ? 1:0) ;
  // El bonus de >5 reps para powermoves se suma al total general.
  // O si se quiere que se refleje en el subtotal de powermoves, se usa `powerMoveAreaTotal`.

  // JSX para PowerMoves (selección jerárquica)
  const renderPowerMoveSelector = () => {
    const categories = Object.keys(defaultTricksByTab.powermoves);
    let exercises = [];
    if (pm_category) {
      exercises = Object.keys(defaultTricksByTab.powermoves[pm_category]);
    }
    let staticElementsForPM = [];
    if (pm_category && pm_exercise) {
      staticElementsForPM = defaultTricksByTab.powermoves[pm_category][pm_exercise];
    }

    return (
      <div className="space-y-2 mt-2 border p-2 rounded">
        <h3 className="font-medium">Configurar PowerMove:</h3>
        <Select onValueChange={setPm_category} value={pm_category || ""}>
          <SelectTrigger><SelectValue placeholder="1. Selecciona Tipus (Empuje/Tiron)" /></SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>

        {pm_category && (
          <Select onValueChange={setPm_exercise} value={pm_exercise || ""}>
            <SelectTrigger><SelectValue placeholder="2. Selecciona Exercici" /></SelectTrigger>
            <SelectContent>
              {exercises.map(ex => <SelectItem key={ex} value={ex}>{ex.charAt(0).toUpperCase() + ex.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {pm_category && pm_exercise && (
          <Select onValueChange={(val) => {
            const selected = staticElementsForPM.find(s => s.originalStatic === val);
            setPm_staticElement(selected);
            // Actualizar newTrick con el nombre base del estático para el PM
            setNewTrick(prev => ({ ...prev, name: selected.originalStatic, base: selected.staticBase / 3 })); // Base ya está dividida
          }} value={pm_staticElement?.originalStatic || ""}>
            <SelectTrigger><SelectValue placeholder="3. Selecciona Element Estàtic Base" /></SelectTrigger>
            <SelectContent>
              {staticElementsForPM.map(el => <SelectItem key={el.name} value={el.originalStatic}>{el.originalStatic} (Base Estàtic: {el.staticBase} / 3 = {(el.staticBase/3).toFixed(2)})</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        
        {pm_staticElement && (
          <>
            <label className="block text-sm font-medium mt-2">Modificador de PowerMove (Tuck, Straddle, etc.)</label>
            <Select onValueChange={(v) => setSelectedPowerMoveModifier(Number(v))} value={selectedPowerMoveModifier.toString()}>
              <SelectTrigger><SelectValue placeholder="Modificador" /></SelectTrigger>
              <SelectContent>
                {staticModifiers.map(m => <SelectItem key={m.name} value={m.value.toString()}>{m.name} (x{m.value})</SelectItem>)}
              </SelectContent>
            </Select>

            <label className="block text-sm font-medium mt-2">Punts Extra per PowerMove</label>
            <Select onValueChange={(v) => setSelectedPowerMoveExtra(Number(v))} value={selectedPowerMoveExtra.toString()}>
              <SelectTrigger><SelectValue placeholder="Punts Extra" /></SelectTrigger>
              <SelectContent>
                {extraPointOptions.map(e => <SelectItem key={e.name} value={e.value.toString()}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="pm_more_than_5_reps" checked={pm_moreThan5Reps} onChange={(e) => setPm_moreThan5Reps(e.target.checked)} />
                <label htmlFor="pm_more_than_5_reps" className="text-sm font-medium">Combo de més de 5 repeticions (+1p al total de Powermoves)</label>
            </div>
          </>
        )}
      </div>
    );
  };


  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto"> {/* Aumentado max-w para más contenido */}
      <h1 className="text-2xl font-bold text-center">Sthenos Mania - Puntuació Jutge</h1>
      <div className="text-sm text-center text-muted-foreground">Selecciona un participant i puntua cada apartat o afegeix trucs executats per calcular la puntuació total.</div>

      <div className="flex justify-center gap-2">
        <Button variant={participant === "A" ? "default" : "outline"} onClick={() => setParticipant("A")}>Participant A</Button>
        <Button variant={participant === "B" ? "default" : "outline"} onClick={() => setParticipant("B")}>Participant B</Button>
      </div>

      <div className="flex justify-center gap-2 items-center">
        <label className="font-semibold">Dificultat:</label>
        <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[180px]"> <SelectValue placeholder="Selecciona dificultat" /> </SelectTrigger>
            <SelectContent>
                <SelectItem value="beginner">Principiant (x1.5)</SelectItem>
                <SelectItem value="amateur">Amateur (x1)</SelectItem>
                <SelectItem value="professional">Professional (x0.75)</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="freestyle" className="w-full" onValueChange={(val) => { setCurrentTab(val); setSelectedTrickName(null); setNewTrick({ name: "", base: 0, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} }); }}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 gap-1"> {/* Adaptado para más tabs */}
          {Object.keys(descriptions).map(key => (
            <TabsTrigger key={key} value={key} className="capitalize">{key}</TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(descriptions).map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardContent className="p-4 space-y-2">
                <label className="capitalize font-semibold text-lg">{key}</label>
                <p className="text-sm text-muted-foreground">{descriptions[key]}</p>
                <p className="text-md font-bold">
                    Subtotal: {(key === "powermoves" ? powerMoveAreaTotal : areaScore(key)).toFixed(2)} punts
                </p>

                {/* Contenido específico para la pestaña de COMBOS */}
                {key === "combos" && (
                  <div className="space-y-2 mt-2">
                    <h3 className="font-medium">Marcar àmbits tocats i condicions:</h3>
                    {Object.keys(comboAreas).map(area => (
                      <div key={area} className="flex items-center space-x-2">
                        <input type="checkbox" id={`combo-${area}`} checked={comboAreas[area]} onChange={(e) => setComboAreas(prev => ({ ...prev, [area]: e.target.checked }))} />
                        <label htmlFor={`combo-${area}`} className="capitalize">{area} (+2p)</label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="combo-unbroken" checked={comboUnbroken} onChange={(e) => setComboUnbroken(e.target.checked)} />
                      <label htmlFor="combo-unbroken">Unbroken (+2p)</label>
                    </div>
                    <Button variant="destructive" size="sm" onClick={applyComboPenalty} className="mt-2">
                      Neteja Baixa (-1p)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Sección para añadir trucos (no para combos) */}
      {currentTab !== "combos" && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="font-semibold">Afegir Truc a: {currentTab}</h2>
            
            {/* Selector de Trucos Recomendados (Freestyle, Statics, Balance) */}
            { (currentTab === "freestyle" || currentTab === "statics" || currentTab === "balance") &&
              defaultTricksByTab[currentTab] && defaultTricksByTab[currentTab].length > 0 && (
              <>
                <h3 className="font-medium">Trucs recomanats ({currentTab})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(defaultTricksByTab[currentTab] || []).map((t, i) => (
                    <Button
                      key={i}
                      variant={selectedTrickName === t.name ? "default" : "outline"}
                      onClick={() => {
                        setNewTrick({ name: t.name, base: t.base, clean: 10, modifierValue: 1, extraPointsValue: 0, powerMoveDetails: {} });
                        setSelectedTrickName(t.name);
                        if (currentTab === "statics") { // Resetear modificadores de estáticos al seleccionar nuevo truco
                            setSelectedStaticModifier(staticModifiers.find(m=>m.name==="Full").value);
                            setSelectedStaticExtra(0);
                        }
                      }}
                    >
                      {t.name} (Base: {t.base}) {t.isSuper ? "[S]" : ""}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Inputs específicos para STATICS */}
            {currentTab === "statics" && selectedTrickName && !defaultTricksByTab.statics.find(t=>t.name === selectedTrickName)?.isSuper && (
              <div className="space-y-2 mt-2 border p-2 rounded">
                <label className="block text-sm font-medium">Modificador Estàtic (Tuck, Straddle, etc.)</label>
                 <Select onValueChange={(v) => setSelectedStaticModifier(Number(v))} value={selectedStaticModifier.toString()}>
                    <SelectTrigger><SelectValue placeholder="Modificador" /></SelectTrigger>
                    <SelectContent>
                        {staticModifiers.map(m => <SelectItem key={m.name} value={m.value.toString()}>{m.name} (x{m.value})</SelectItem>)}
                    </SelectContent>
                </Select>

                <label className="block text-sm font-medium mt-2">Punts Extra per Estàtic</label>
                <Select onValueChange={(v) => setSelectedStaticExtra(Number(v))} value={selectedStaticExtra.toString()}>
                    <SelectTrigger><SelectValue placeholder="Punts Extra" /></SelectTrigger>
                    <SelectContent>
                        {extraPointOptions.map(e => <SelectItem key={e.name} value={e.value.toString()}>{e.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            )}
             {currentTab === "statics" && selectedTrickName && defaultTricksByTab.statics.find(t=>t.name === selectedTrickName)?.isSuper && (
                 <div className="space-y-2 mt-2 border p-2 rounded">
                     <p className='text-sm text-muted-foreground'>Els Supertrucs Estàtics tenen {defaultTricksByTab.statics.find(t=>t.name === selectedTrickName)?.base} punts base (abans de multiplicador de dificultat i neteja). No s'apliquen modificadors de posició (Tuck, Full, etc.). Pots afegir extres.</p>
                     <label className="block text-sm font-medium mt-2">Punts Extra per Supertruc Estàtic</label>
                     <Select onValueChange={(v) => setSelectedStaticExtra(Number(v))} value={selectedStaticExtra.toString()}>
                         <SelectTrigger><SelectValue placeholder="Punts Extra" /></SelectTrigger>
                         <SelectContent>
                             {extraPointOptions.map(e => <SelectItem key={e.name} value={e.value.toString()}>{e.name}</SelectItem>)}
                         </SelectContent>
                     </Select>
                 </div>
             )}


            {/* Selector para POWERMOVES */}
            {currentTab === "powermoves" && renderPowerMoveSelector()}
            
            {/* Input de Limpieza (común si hay un truco base seleccionado o es PM) */}
            {(selectedTrickName || (currentTab === "powermoves" && pm_staticElement)) && (
              <div className="mt-2">
                <label className="block text-sm font-medium">Neteja (1-10)</label>
                <Input type="number" min="1" max="10" placeholder="Neteja (1-10)" value={newTrick.clean} onChange={(e) => setNewTrick({ ...newTrick, clean: Math.max(1, Math.min(10, Number(e.target.value))) })} />
              </div>
            )}

            {/* Botón de Añadir Truco (visible si hay algo que añadir) */}
            { (selectedTrickName || (currentTab === "powermoves" && pm_staticElement)) && (
              <Button onClick={addTrick} className="mt-3 w-full">Afegir truc a {currentTab}</Button>
            )}
          </CardContent>
        </Card>
      )}


      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2">Trucs realitzats ({tricks.length})</h2>
          {tricks.length === 0 ? <p className="text-sm text-muted-foreground">Encara no s'han afegit trucs.</p> : (
            <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
              {tricks.map((trick, i) => (
                <li key={i} className="flex justify-between items-center p-1 border-b">
                  <span>✅ {trick.name} — {trick.area} — Neteja: {trick.rawDetailsForDebug?.clean || trick.clean}/10 — Score: {trick.score.toFixed(2)}</span>
                  <Button variant="destructive" size="sm" onClick={() => removeTrick(i)}>✕</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="text-xl font-bold text-center p-4 bg-primary text-primary-foreground rounded">TOTAL: {totalScore.toFixed(2)} PUNTS</div>
    </div>
  );
}
