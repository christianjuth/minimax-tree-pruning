import { useEffect, useMemo, useState } from 'react';
import Tree from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css'
import styled from 'styled-components'
import { use100vh } from 'react-div-100vh'

const Page = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`

const TextArea = styled.textarea`
  flex: 1;
  background-color: black;
  color: white;
  font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`

function node(name, childrenOrValue) {
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
    children
  }
}

const DEFAULT_TREE = `
  node('A', [
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
  ])
`

function minimax(direction = '', node, alpha = Number.MIN_SAFE_INTEGER, beta = Number.MAX_SAFE_INTEGER, isMax = true) {
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

      const evaluation = minimax(direction, child, alpha, beta, !isMax)
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

function render(node, color = 'black') {
  if (node.children.length === 0) {
    return {
      ...node,
      gProps: {
        className: `node-${color}`
      }
    }
  } 
  const children = node.children.slice(0).reverse().map(node => render(node, node.color ?? color))
  return {
    ...node,
    children,
    gProps: {
      className: `node-${color}`
    }
  }
}

function App() {
  const windowHeight = use100vh() ?? 0
  const [[height, width], setDimensions] = useState([windowHeight,400])
  const [direction, setDirection] = useState('')
  const [treeString, setTreeString] = useState(DEFAULT_TREE)

  const data = useMemo(
    () => {
      let tree
      try {
        tree = eval(treeString)
        minimax(direction, tree)
      } catch (e) {
        tree = node('A', 0)
      }

      return render(tree)
    },
    [direction, treeString]
  )

  useEffect(() => {
    function updateDimensions() {
      setDimensions([windowHeight/2, window.innerWidth-50])
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => {
      window.removeEventListener('resize', updateDimensions)
    }
  }, [windowHeight])

  return (
    <Page>
      <TextArea
        value={treeString}
        onChange={e => setTreeString(e.target.value)}
      />
      <FlexRow>
        <button onClick={() => setDirection()}>No pruning</button>
        <button onClick={() => setDirection('rtl')}>Rtl pruning</button>
        <button onClick={() => setDirection('ltr')}>Ltr pruning</button>
      </FlexRow>
      <Tree
        data={data}
        height={height}
        width={width}
      />
    </Page>
  );
}

export default App;
