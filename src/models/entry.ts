import { INode } from 'react-accessible-treeview'

export interface Entry {
  id: number
  name: string
  isDirectory: boolean
  content?: string | null
  children?: Entry[]
}

export type nodeMetadata = {
  isDirectory: boolean
  content: string | null
}

export type TreeNode = INode<nodeMetadata>
export type Tree = TreeNode[]
