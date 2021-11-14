import { useEffect, useMemo, useRef, useState } from 'react';
import Tree from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css'
import styled from 'styled-components'
import { use100vh } from 'react-div-100vh'
import { v4 as uuid } from 'uuid'
import * as indentation from 'indent-textarea';
import GitHubForkRibbon from 'react-github-fork-ribbon';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  background-color: black;
  color: white;
`

const TextArea = styled.textarea`
  flex: 1;
  color: white;
  font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
  padding: 15px;
  background-color: transparent;
  resize: none;
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`

const FlexGrow = styled.div`
  flex: 1;
`

const Span = styled.span`
  margin-left: 10px;
  color: rgba(255,255,255,0.7)
`

function node(name, childrenOrValue = 0) {
  let children = []
  let value = null

  if (typeof childrenOrValue === 'number') {
    value = childrenOrValue
    name += ` (${value})`
  } else if (Array.isArray(childrenOrValue)) {
    children = childrenOrValue
  }
   
  return {
    name,
    value,
    children,
    id: uuid(),
    keyProp: 'id'
  }
}

const DEFAULT_TREE = `node('A', [
  node('B', [
    node('D', 3),
    node('E', 5)
  ]),
  node('C', [
    node('F', [
      node('I', [
        node('M', 0),
        node('N', 7)
      ]),
      node('J', 5)
    ]),
    node('G', [
      node('K', 7),
      node('L', 8)
    ]),
    node('H', 4)
  ])
])`

function minimax(direction = '', node, isMax = true, alpha = Number.MIN_SAFE_INTEGER, beta = Number.MAX_SAFE_INTEGER) {
  if (node.value !== null) {
    return node.value
  } else {
    const values = []
    let pruning = false

    const children = node.children.slice(0)
    if (direction === 'ltr') {
      children.reverse()
    }

    for (const child of children) {
      if (pruning) {
        child.color = 'red'
        continue;
      }

      const evaluation = minimax(direction, child, !isMax, alpha, beta)
      values.push(evaluation)
      if (isMax) {
        alpha = Math.max(alpha, evaluation)
      } else {
        beta = Math.min(beta, evaluation)
      }
      if (direction && beta <= alpha) {
        pruning = true
      }
    }

    if (isMax) {
      node.value = Math.max(...values)
    } else {
      node.value = Math.min(...values)
    }
    node.name += ` (${node.value})`
    return node.value
  }
}

function render(node, color = 'white') {
  if (node.children.length === 0) {
    return {
      ...node,
      gProps: {
        className: `node-${color}`
      }
    }
  } 
  const children = node.children.map(node => render(node, node.color ?? color))
  return {
    ...node,
    children,
    gProps: {
      className: `node-${color}`
    }
  }
}

function saveTree(data) {
  localStorage.setItem('tree', data)
}

function getSavedTree() {
  return localStorage.getItem('tree') ?? DEFAULT_TREE 
}

function App() {
  const windowHeight = use100vh() ?? 0
  const [[height, width], setDimensions] = useState([windowHeight,400])
  const [direction, setDirection] = useState('')
  const [treeString, setTreeString] = useState(null)
  const [startWith, setStartWith] = useState('max')

  useEffect(() => {
    setTreeString(getSavedTree())
  }, [])

  const data = useMemo(
    () => {
      if (treeString !== null) {
        try {
          const tree = eval(treeString)
          minimax(direction, tree, startWith === 'max')
          tree.name = `${startWith}: ${tree.name}`
          saveTree(treeString)
          return render(tree)
        } catch (e) {
          console.log(e)
        }
      }
      return node('A', 0)
    },
    [direction, treeString, startWith]
  )


  useEffect(() => {
    function updateDimensions() {
      setDimensions([windowHeight/2, window.innerWidth])
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [windowHeight])

  const textAreaRef = useRef(null)
  useEffect(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.addEventListener('keydown', indentation.eventHandler);
      return () => {
        textArea.removeEventListener('keydown', indentation.eventHandler);
      }
    }
  }, [])

  return (
    <Page style={{minHeight: windowHeight}}>
      <GitHubForkRibbon 
        href="//github.com/christianjuth/minimax-tree-pruning"
        target="_blank"
        position="right"
      >
        Fork me on GitHub
      </GitHubForkRibbon>
      <TextArea
        ref={textAreaRef}
        value={treeString}
        onChange={e => setTreeString(e.target.value)}
      />
      <FlexRow>
        <select value={startWith} onChange={e => setStartWith(e.target.value)}>
          <option value='min'>Start with: min</option>
          <option value='max'>Start with: max</option>
        </select>
        <select value={direction} onChange={e => setDirection(e.target.value)}>
          <option value="">Pruning: none</option>
          <option value="ltr">Pruning: ltr</option>
          <option value="rtl">Pruning: rtl</option>
        </select>
        <FlexGrow/>
        <button onClick={() => setTreeString(DEFAULT_TREE)}>Reset tree</button>
      </FlexRow>
      <Span><i>Right</i></Span>
      <Tree
        data={data}
        height={height}
        width={width}
        keyProp='id'
      />
      <Span><i>Left</i></Span>
    </Page>
  );
}

export default App;
